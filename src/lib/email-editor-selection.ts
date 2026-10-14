import type { Component, Editor } from 'grapesjs';
import {
  getComponentType,
  isMjmlContentComponent,
  isMjmlLeafComponent,
  MJML_LEAF_TYPES,
} from '@/lib/email-editor-structure';

const STRUCTURE_TYPES = new Set(['mj-section', 'mj-column', 'mj-group', 'mj-wrapper', 'mj-body', 'wrapper', 'mj-hero']);

type EditorModel = {
  setHovered?: (c: Component | null | undefined, opts?: { useValid?: boolean; abort?: boolean }) => void;
  setSelected?: (
    c: Component | null | undefined,
    opts?: { useValid?: boolean; abort?: boolean; event?: Event }
  ) => void;
};

function editorModel(editor: Editor): EditorModel | undefined {
  return (editor as Editor & { em?: EditorModel }).em;
}

function componentEl(component: Component): HTMLElement | null {
  return component.getEl?.() ?? (component.view as { el?: HTMLElement } | undefined)?.el ?? null;
}

function componentFromElement(editor: Editor, el: Element | null): Component | null {
  if (!el) return null;
  try {
    let node: Element | null = el;
    while (node) {
      const byId = editor.Components.getById((node as HTMLElement).id);
      if (byId) return byId;
      const maybe = (
        editor.Canvas as unknown as { getComponent?: (e: Element) => Component | undefined }
      ).getComponent?.(node);
      if (maybe) return maybe;
      node = node.parentElement;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Prefer the deepest leaf under the pointer using the iframe hit stack. */
function leafAtPoint(editor: Editor, clientX: number, clientY: number): Component | null {
  const doc = editor.Canvas.getDocument();
  if (!doc?.elementsFromPoint) return null;

  let stack: Element[];
  try {
    stack = doc.elementsFromPoint(clientX, clientY);
  } catch {
    return null;
  }

  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    // Skip Grapes overlay chrome that may live in the frame.
    if (el.classList?.contains('gjs-highlighter') || el.classList?.contains('gjs-badge')) continue;
    const cmp = componentFromElement(editor, el);
    if (cmp && isMjmlLeafComponent(cmp)) return cmp;
  }

  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const cmp = componentFromElement(editor, el);
    if (cmp && isMjmlContentComponent(cmp)) return cmp;
  }

  return null;
}

function preferLeafOverStructure(component: Component | null, clientX: number, clientY: number): Component | null {
  if (!component) return null;
  if (isMjmlLeafComponent(component)) return component;

  const type = getComponentType(component);
  if (!STRUCTURE_TYPES.has(type) && type !== '') {
    return component;
  }

  const stack = [...component.components().models];
  while (stack.length) {
    const current = stack.pop()!;
    if (isMjmlLeafComponent(current)) {
      const el = componentEl(current);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          return current;
        }
      }
    }
    stack.push(...current.components().models);
  }

  // Single-child structure chrome → treat as the child (common MJML padding miss).
  const kids = component.components().models;
  if (kids.length === 1) {
    const only = kids[0]!;
    if (isMjmlLeafComponent(only)) return only;
    if (getComponentType(only) === 'mj-column' || getComponentType(only) === 'mj-group') {
      const nested = only.components().models;
      if (nested.length === 1 && isMjmlLeafComponent(nested[0]!)) return nested[0]!;
    }
  }

  return component;
}

function resolvePreferredTarget(
  editor: Editor,
  component: Component | null | undefined,
  clientX: number,
  clientY: number
): Component | null {
  if (!component) return null;
  const fromPoint = leafAtPoint(editor, clientX, clientY);
  if (fromPoint) return fromPoint;
  return preferLeafOverStructure(component, clientX, clientY);
}

function applyPointerEventsModel(editor: Editor) {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  const styleId = 'sbm-email-hit-testing';
  if (doc.getElementById(styleId)) return;

  const style = doc.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Structure wrappers should not own the hover outline when content is under the pointer. */
    [data-gjs-type="mj-section"],
    [data-gjs-type="mj-wrapper"],
    [data-gjs-type="mj-body"] {
      pointer-events: none;
    }
    [data-gjs-type="mj-column"],
    [data-gjs-type="mj-group"],
    [data-gjs-type="mj-hero"] {
      pointer-events: auto;
    }
    [data-gjs-type="mj-text"],
    [data-gjs-type="mj-button"],
    [data-gjs-type="mj-image"],
    [data-gjs-type="mj-divider"],
    [data-gjs-type="mj-spacer"],
    [data-gjs-type="mj-social"],
    [data-gjs-type="mj-navbar"] {
      pointer-events: auto !important;
      position: relative;
      z-index: 2;
    }
  `;
  doc.head.appendChild(style);
}

function applyHoverableDefaults(editor: Editor) {
  for (const type of MJML_LEAF_TYPES) {
    editor.Components.addType(type, {
      model: {
        defaults: {
          highlightable: true,
          hoverable: true,
          selectable: true,
        },
      },
    });
  }

  for (const type of ['mj-section', 'mj-wrapper', 'mj-body', 'mj-group'] as const) {
    editor.Components.addType(type, {
      model: {
        defaults: {
          highlightable: false,
          hoverable: false,
        },
      },
    });
  }

  // Columns stay selectable for layout, but hover outline prefers leaves via hover:before.
  editor.Components.addType('mj-column', {
    model: {
      defaults: {
        highlightable: true,
        hoverable: true,
      },
    },
  });
}

/**
 * Leaf-first hover/selection so paragraphs and buttons highlight instead of parent sections.
 * Uses Grapes `component:hover:before` / `component:select:before` (abort + redirect) rather than
 * post-hoc hovered fixes, which often lack mouse coordinates.
 */
export function installEmailEditorSelectionHitTesting(editor: Editor): () => void {
  applyHoverableDefaults(editor);

  const pointer = { x: 0, y: 0, inFrame: false };
  let redirectingHover = false;
  let redirectingSelect = false;
  let pointerDoc: Document | null = null;

  const onPointerMove = (event: MouseEvent) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inFrame = true;
  };

  const onPointerLeave = () => {
    pointer.inFrame = false;
  };

  const attachPointerTracking = () => {
    if (pointerDoc) {
      pointerDoc.removeEventListener('mousemove', onPointerMove, true);
      pointerDoc.removeEventListener('mouseleave', onPointerLeave, true);
      pointerDoc = null;
    }
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    doc.addEventListener('mousemove', onPointerMove, true);
    doc.addEventListener('mouseleave', onPointerLeave, true);
    pointerDoc = doc;
    applyPointerEventsModel(editor);
  };

  const detachPointerTracking = () => {
    if (pointerDoc) {
      pointerDoc.removeEventListener('mousemove', onPointerMove, true);
      pointerDoc.removeEventListener('mouseleave', onPointerLeave, true);
      pointerDoc = null;
    }
  };

  const onFrameLoad = () => {
    applyPointerEventsModel(editor);
    attachPointerTracking();
  };

  editor.on('canvas:frame:load', onFrameLoad);
  editor.on('load', onFrameLoad);
  onFrameLoad();

  const onHoverBefore = (component: Component, opts: { abort?: boolean }) => {
    if (redirectingHover || !component) return;
    if (!pointer.inFrame) return;

    const preferred = resolvePreferredTarget(editor, component, pointer.x, pointer.y);
    if (!preferred || preferred === component) {
      // Don't paint a big section/body outline when the pointer isn't on a leaf.
      if (STRUCTURE_TYPES.has(getComponentType(component)) && !isMjmlLeafComponent(component)) {
        const type = getComponentType(component);
        if (type === 'mj-section' || type === 'mj-wrapper' || type === 'mj-body') {
          opts.abort = true;
        }
      }
      return;
    }

    if (!isMjmlLeafComponent(preferred) && !isMjmlContentComponent(preferred)) return;

    opts.abort = true;
    redirectingHover = true;
    try {
      editorModel(editor)?.setHovered?.(preferred, { useValid: false });
    } finally {
      redirectingHover = false;
    }
  };

  const onSelectBefore = (component: Component, opts: { abort?: boolean; event?: Event }) => {
    if (redirectingSelect || !component) return;

    const mouse = opts.event && 'clientX' in opts.event ? (opts.event as MouseEvent) : null;
    const x = mouse?.clientX ?? pointer.x;
    const y = mouse?.clientY ?? pointer.y;
    if (!mouse && !pointer.inFrame) return;

    const preferred = resolvePreferredTarget(editor, component, x, y);
    if (!preferred || preferred === component) return;
    if (!isMjmlLeafComponent(preferred) && !isMjmlContentComponent(preferred)) return;

    opts.abort = true;
    redirectingSelect = true;
    try {
      editor.select(preferred);
    } finally {
      redirectingSelect = false;
    }
  };

  editor.on('component:hover:before', onHoverBefore as never);
  editor.on('component:select:before', onSelectBefore as never);

  return () => {
    editor.off('canvas:frame:load', onFrameLoad);
    editor.off('load', onFrameLoad);
    editor.off('component:hover:before', onHoverBefore as never);
    editor.off('component:select:before', onSelectBefore as never);
    detachPointerTracking();
  };
}
