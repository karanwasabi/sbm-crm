import type { Component, Editor } from 'grapesjs';
import { getComponentType, isMjmlLeafComponent, MJML_LEAF_TYPES } from '@/lib/email-editor-structure';

const STRUCTURE_TYPES = new Set(['mj-section', 'mj-column', 'mj-group', 'mj-wrapper', 'mj-body', 'wrapper']);

function componentFromElement(editor: Editor, el: Element | null): Component | null {
  if (!el) return null;
  try {
    // Walk up DOM to find a grapes component element
    let node: Element | null = el;
    while (node) {
      const cmp = editor.Components.getById((node as HTMLElement).id) || null;
      if (cmp) return cmp;
      // Grapes stores component via getComponent on canvas helper
      const maybe = (
        editor.Canvas as unknown as { getComponent?: (e: Element) => Component | undefined }
      ).getComponent?.(node);
      if (maybe) return maybe;
      node = node.parentElement;
    }
  } catch {
    // fall through
  }

  // Fallback: scan selected/hovered parents by matching getEl
  const wrapper = editor.getWrapper();
  if (!wrapper) return null;

  const matchDeep = (component: Component): Component | null => {
    const viewEl = component.getEl?.() ?? (component.view as { el?: HTMLElement } | undefined)?.el;
    if (viewEl && (viewEl === el || viewEl.contains(el))) {
      for (const child of component.components().models) {
        const nested = matchDeep(child);
        if (nested) return nested;
      }
      return component;
    }
    for (const child of component.components().models) {
      const nested = matchDeep(child);
      if (nested) return nested;
    }
    return null;
  };

  return matchDeep(wrapper);
}

function deepestLeafUnder(component: Component | null): Component | null {
  if (!component) return null;
  if (isMjmlLeafComponent(component)) return component;

  // Prefer a leaf descendant that fills most of the hover target when parents are hit.
  const leaves: Component[] = [];
  const walk = (c: Component) => {
    if (isMjmlLeafComponent(c)) {
      leaves.push(c);
      return;
    }
    for (const child of c.components().models) {
      walk(child);
    }
  };
  walk(component);
  if (leaves.length === 1) return leaves[0]!;
  return component;
}

function preferLeafOverStructure(component: Component | null, clientX: number, clientY: number): Component | null {
  if (!component) return null;
  if (isMjmlLeafComponent(component)) return component;
  if (!STRUCTURE_TYPES.has(getComponentType(component)) && getComponentType(component) !== '') {
    return component;
  }

  // If pointer is over a leaf child's element, use that leaf.
  for (const child of component.components().models) {
    const preferred = preferLeafOverStructure(child, clientX, clientY);
    if (preferred && isMjmlLeafComponent(preferred)) {
      const el = preferred.getEl?.() ?? (preferred.view as { el?: HTMLElement } | undefined)?.el;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          return preferred;
        }
      }
    }
  }

  // Walk descendants for any leaf under the point
  const stack = [...component.components().models];
  while (stack.length) {
    const current = stack.pop()!;
    if (isMjmlLeafComponent(current)) {
      const el = current.getEl?.() ?? (current.view as { el?: HTMLElement } | undefined)?.el;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
          return current;
        }
      }
    }
    stack.push(...current.components().models);
  }

  return deepestLeafUnder(component);
}

function applyPointerEventsModel(editor: Editor) {
  // Inject canvas styles so structure wrappers don't steal hits from content rows.
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  const styleId = 'sbm-email-hit-testing';
  if (doc.getElementById(styleId)) return;

  const style = doc.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Let leaf content win hit-testing over section/column chrome. */
    [data-gjs-type="mj-section"] {
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
      pointer-events: all !important;
      position: relative;
      z-index: 2;
    }
  `;
  doc.head.appendChild(style);
}

/**
 * Leaf-first hover/selection so paragraphs and buttons highlight instead of parent sections.
 */
export function installEmailEditorSelectionHitTesting(editor: Editor): () => void {
  for (const type of MJML_LEAF_TYPES) {
    editor.Components.addType(type, {
      model: {
        defaults: {
          highlightable: true,
          hoverable: true,
        },
      },
    });
  }

  editor.Components.addType('mj-body', {
    model: {
      defaults: {
        highlightable: false,
        hoverable: false,
      },
    },
  });

  const onFrameLoad = () => {
    applyPointerEventsModel(editor);
  };

  editor.on('canvas:frame:load', onFrameLoad);
  editor.on('load', onFrameLoad);
  applyPointerEventsModel(editor);

  const onHover = (component: Component | undefined, event?: { event?: MouseEvent }) => {
    const mouse = event?.event;
    if (!component || !mouse) return;
    const preferred = preferLeafOverStructure(component, mouse.clientX, mouse.clientY);
    if (preferred && preferred !== component && isMjmlLeafComponent(preferred)) {
      // setHovered lives on EditorModel (private API) — used for leaf-first hover.
      const em = (editor as Editor & { em?: { setHovered?: (c: Component) => void } }).em;
      em?.setHovered?.(preferred);
    }
  };

  // Grapes emits component:hovered with (component, { event? }) depending on version
  const hoverHandler = (...args: unknown[]) => {
    const component = args[0] as Component | undefined;
    const meta = args[1] as { event?: MouseEvent } | MouseEvent | undefined;
    const mouse =
      meta && 'clientX' in (meta as object) ? (meta as MouseEvent) : (meta as { event?: MouseEvent })?.event;
    if (!component || !mouse) return;
    onHover(component, { event: mouse });
  };

  editor.on('component:hovered', hoverHandler as never);

  const onCanvasClick = (event: MouseEvent) => {
    const frame = editor.Canvas.getFrameEl();
    const doc = frame?.contentDocument;
    if (!doc || event.target == null) return;
    if (!(event.target instanceof Element)) return;
    if (!doc.documentElement.contains(event.target)) return;

    const fromDom = componentFromElement(editor, event.target);
    const preferred = preferLeafOverStructure(fromDom, event.clientX, event.clientY);
    if (preferred && isMjmlLeafComponent(preferred)) {
      const selected = editor.getSelected();
      if (selected !== preferred) {
        editor.select(preferred);
      }
    }
  };

  // Attach after frame exists — always detach first so frame reloads don't stack handlers.
  let clickDoc: Document | null = null;
  const attachClick = () => {
    if (clickDoc) {
      clickDoc.removeEventListener('click', onCanvasClick, true);
      clickDoc = null;
    }
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    doc.addEventListener('click', onCanvasClick, true);
    clickDoc = doc;
  };
  const detachClick = () => {
    if (clickDoc) {
      clickDoc.removeEventListener('click', onCanvasClick, true);
      clickDoc = null;
    }
  };

  editor.on('canvas:frame:load', attachClick);
  attachClick();

  return () => {
    editor.off('canvas:frame:load', onFrameLoad);
    editor.off('load', onFrameLoad);
    editor.off('component:hovered', hoverHandler as never);
    editor.off('canvas:frame:load', attachClick);
    detachClick();
  };
}
