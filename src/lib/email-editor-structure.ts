import type { Component, Editor } from 'grapesjs';
import { flushActiveTextEditing } from '@/lib/grapes-email-editor';

export const MJML_CONTENT_TYPES = new Set([
  'mj-text',
  'mj-button',
  'mj-image',
  'mj-divider',
  'mj-spacer',
  'mj-social',
  'mj-social-element',
  'mj-navbar',
  'mj-navbar-link',
  'mj-raw',
]);

export const MJML_LEAF_TYPES = new Set(['mj-text', 'mj-button', 'mj-image', 'mj-divider', 'mj-spacer']);

export type InsertContentKind = 'text' | 'button' | 'divider' | 'section-1-col';

const BODY_TEXT_HTML =
  '<mj-text color="#475569" font-size="16px" line-height="1.6" padding-top="8px" padding-bottom="8px">Write your message here.</mj-text>';

const BODY_BUTTON_HTML =
  '<mj-button background-color="#0f766e" color="#ffffff" href="https://slowburnmethod.in" target="_blank" rel="noopener noreferrer" border-radius="999px">Watch the full episode</mj-button>';

const FLASH_CLASS = 'sbm-email-flash';
const FLASH_MS = 1500;

export function getComponentType(component: Component | null | undefined): string {
  if (!component) return '';
  return String(component.get('type') ?? '');
}

export function findAncestorByType(component: Component | null | undefined, type: string): Component | null {
  let current: Component | null | undefined = component;
  while (current && !current.is('wrapper')) {
    if (getComponentType(current) === type) {
      return current;
    }
    current = current.parent();
  }
  return null;
}

export function findMjBody(editor: Editor): Component | null {
  const wrapper = editor.getWrapper();
  if (!wrapper) return null;
  const bodies = wrapper.findType('mj-body');
  return bodies[0] ?? null;
}

export function findMjColumn(component: Component | null | undefined): Component | null {
  return findAncestorByType(component, 'mj-column') ?? findAncestorByType(component, 'mj-hero');
}

export function findMjSection(component: Component | null | undefined): Component | null {
  return findAncestorByType(component, 'mj-section');
}

export function isMjmlContentComponent(component: Component | null | undefined): boolean {
  return MJML_CONTENT_TYPES.has(getComponentType(component));
}

export function isMjmlLeafComponent(component: Component | null | undefined): boolean {
  return MJML_LEAF_TYPES.has(getComponentType(component));
}

function collectionIndex(component: Component): number {
  const parent = component.parent();
  if (!parent) return -1;
  return parent.components().indexOf(component);
}

function adjacentColumn(section: Component, column: Component, delta: number): Component | null {
  const columns = section
    .components()
    .models.filter((child) => getComponentType(child) === 'mj-column' || getComponentType(child) === 'mj-group');
  const index = columns.indexOf(column);
  if (index < 0) return null;
  return columns[index + delta] ?? null;
}

function adjacentSection(body: Component, section: Component, delta: number): Component | null {
  const sections = body.components().models.filter((child) => getComponentType(child) === 'mj-section');
  const index = sections.indexOf(section);
  if (index < 0) return null;
  return sections[index + delta] ?? null;
}

function firstColumnInSection(section: Component): Component | null {
  return (
    section.components().models.find((child) => getComponentType(child) === 'mj-column') ??
    section.components().models.find((child) => getComponentType(child) === 'mj-group') ??
    null
  );
}

/**
 * Move a component up/down within its parent. At column edges, content can cross
 * into the previous/next column or section so users aren't trapped near the greeting.
 */
export function moveComponentBy(component: Component, delta: number): Component | null {
  if (!delta) return component;
  const parent = component.parent();
  if (!parent) return null;

  const type = getComponentType(component);
  const siblings = parent.components();
  const index = siblings.indexOf(component);
  if (index < 0) return null;

  const nextIndex = index + delta;
  if (nextIndex >= 0 && nextIndex < siblings.length) {
    // `nextIndex` is the desired final index. Remove first, then insert at that
    // index in the shortened collection — do not adjust like Grapes Component.move,
    // whose `at` means "pre-remove insert slot" and treats `at === index + 1` as a no-op.
    siblings.remove(component, { temporary: true } as never);
    siblings.add(component, { at: nextIndex });
    return component;
  }

  // Cross-column / cross-section for content leaves only.
  if (!MJML_LEAF_TYPES.has(type) && type !== 'mj-social' && type !== 'mj-navbar') {
    return null;
  }

  const column = findMjColumn(component);
  const section = findMjSection(component);
  if (!column || !section) return null;

  const step = delta < 0 ? -1 : 1;
  const neighborColumn = adjacentColumn(section, column, step);
  if (neighborColumn) {
    const at = step < 0 ? neighborColumn.components().length : 0;
    neighborColumn.append(component, { at });
    return component;
  }

  const body = findAncestorByType(section, 'mj-body');
  if (!body) return null;
  const neighborSection = adjacentSection(body, section, step);
  if (!neighborSection) return null;
  const targetColumn = firstColumnInSection(neighborSection);
  if (!targetColumn) return null;
  const at = step < 0 ? targetColumn.components().length : 0;
  targetColumn.append(component, { at });
  return component;
}

function resolveInsertAnchor(editor: Editor): { column: Component; after: Component | null } | null {
  const selected = editor.getSelected();
  if (!selected || selected.is('wrapper')) {
    const body = findMjBody(editor);
    if (!body) return null;
    const lastSection = [...body.components().models].reverse().find((c) => getComponentType(c) === 'mj-section');
    if (!lastSection) return null;
    const column = firstColumnInSection(lastSection);
    if (!column) return null;
    const kids = column.components().models;
    return { column, after: kids[kids.length - 1] ?? null };
  }

  if (getComponentType(selected) === 'mj-column' || getComponentType(selected) === 'mj-hero') {
    const kids = selected.components().models;
    return { column: selected, after: kids[kids.length - 1] ?? null };
  }

  if (getComponentType(selected) === 'mj-section') {
    const column = firstColumnInSection(selected);
    if (!column) return null;
    const kids = column.components().models;
    return { column, after: kids[kids.length - 1] ?? null };
  }

  const column = findMjColumn(selected);
  if (!column) return null;
  if (isMjmlContentComponent(selected)) {
    return { column, after: selected };
  }
  const kids = column.components().models;
  return { column, after: kids[kids.length - 1] ?? null };
}

function insertHtmlInColumn(column: Component, html: string, after: Component | null): Component | null {
  const at = after ? collectionIndex(after) + 1 : column.components().length;
  const added = column.append(html, { at });
  const first = Array.isArray(added) ? added[0] : added;
  return (first as Component | undefined) ?? null;
}

export function insertContentBelowSelection(editor: Editor, kind: InsertContentKind): Component | null {
  if (kind === 'section-1-col') {
    const body = findMjBody(editor);
    if (!body) return null;
    const selected = editor.getSelected();
    const section = findMjSection(selected);
    const at = section ? collectionIndex(section) + 1 : body.components().length;
    const added = body.append(`<mj-section padding="8px 0"><mj-column>${BODY_TEXT_HTML}</mj-column></mj-section>`, {
      at,
    });
    const first = Array.isArray(added) ? added[0] : added;
    return (first as Component | undefined) ?? null;
  }

  const anchor = resolveInsertAnchor(editor);
  if (!anchor) {
    // No column yet — create a section under body.
    const body = findMjBody(editor);
    if (!body) return null;
    const html =
      kind === 'button'
        ? BODY_BUTTON_HTML
        : kind === 'divider'
          ? '<mj-divider border-color="#e2e8f0" />'
          : BODY_TEXT_HTML;
    const added = body.append(`<mj-section padding="8px 0"><mj-column>${html}</mj-column></mj-section>`);
    const section = (Array.isArray(added) ? added[0] : added) as Component | undefined;
    if (!section) return null;
    const column = firstColumnInSection(section);
    return column?.components().at(0) ?? section;
  }

  const html =
    kind === 'button'
      ? BODY_BUTTON_HTML
      : kind === 'divider'
        ? '<mj-divider border-color="#e2e8f0" />'
        : BODY_TEXT_HTML;
  return insertHtmlInColumn(anchor.column, html, anchor.after);
}

function ensureCanvasFlashStyles(editor: Editor) {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  const styleId = 'sbm-email-flash-style';
  if (doc.getElementById(styleId)) return;
  const style = doc.createElement('style');
  style.id = styleId;
  style.textContent = `
    .${FLASH_CLASS} {
      animation: sbm-email-flash-outline 1.4s ease-out;
    }
    @keyframes sbm-email-flash-outline {
      0% {
        outline: 3px solid rgba(244, 94, 67, 0.95);
        outline-offset: 2px;
        background-color: rgba(244, 94, 67, 0.12);
      }
      100% {
        outline: 3px solid rgba(244, 94, 67, 0);
        outline-offset: 2px;
        background-color: transparent;
      }
    }
  `;
  doc.head.appendChild(style);
}

export function revealComponent(editor: Editor, component: Component | null | undefined) {
  if (!component) return;
  editor.select(component);
  ensureCanvasFlashStyles(editor);
  const el = component.getEl?.() ?? (component.view as { el?: HTMLElement } | undefined)?.el;
  if (el && 'scrollIntoView' in el) {
    try {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch {
      // ignore
    }
    el.classList.add(FLASH_CLASS);
    window.setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_MS);
  }
}

export function wrapOrphanContentUnderBody(editor: Editor, component: Component): Component {
  const parent = component.parent();
  if (!parent || getComponentType(parent) !== 'mj-body') {
    return component;
  }
  if (!isMjmlContentComponent(component) && getComponentType(component) !== 'mj-column') {
    return component;
  }

  const index = collectionIndex(component);
  parent.components().remove(component, { temporary: true } as never);

  const type = getComponentType(component);
  let sectionHtml: string;
  if (type === 'mj-column') {
    sectionHtml = '<mj-section padding="8px 0"></mj-section>';
  } else {
    sectionHtml = '<mj-section padding="8px 0"><mj-column></mj-column></mj-section>';
  }

  const added = parent.append(sectionHtml, { at: index });
  const section = (Array.isArray(added) ? added[0] : added) as Component;
  if (type === 'mj-column') {
    section.append(component);
    return component;
  }
  const column = firstColumnInSection(section);
  column?.append(component);
  return component;
}

/** Strip non-visual comment/textnode noise under mj-body that breaks sorter indices. */
export function stripBodyNoise(editor: Editor) {
  const body = findMjBody(editor);
  if (!body) return;
  const removable = body.components().models.filter((child) => {
    const type = getComponentType(child);
    if (type === 'comment' || type === 'textnode') return true;
    if (!type && !child.get('tagName')) return true;
    return false;
  });
  for (const child of removable) {
    child.remove();
  }
}

export function installEmailEditorStructureGuards(editor: Editor): () => void {
  const contentDropQuery = [...MJML_CONTENT_TYPES].map((t) => `[data-gjs-type="${t}"]`).join(', ');

  for (const type of ['mj-text', 'mj-button', 'mj-image', 'mj-divider', 'mj-spacer'] as const) {
    editor.Components.addType(type, {
      model: {
        defaults: {
          highlightable: true,
        },
      },
    });
  }

  editor.Components.addType('mj-column', {
    model: {
      defaults: {
        droppable: contentDropQuery,
      },
    },
  });

  const onAdd = (component: Component) => {
    wrapOrphanContentUnderBody(editor, component);
  };

  const onLoad = () => {
    stripBodyNoise(editor);
  };

  editor.on('component:add', onAdd);
  editor.on('load', onLoad);
  stripBodyNoise(editor);

  return () => {
    editor.off('component:add', onAdd);
    editor.off('load', onLoad);
  };
}

export function installEmailEditorDragFlush(editor: Editor): () => void {
  const onDragStart = () => {
    void flushActiveTextEditing(editor);
  };

  // Grapes sorter / component drag lifecycle
  editor.on('sorter:drag:start', onDragStart);
  editor.on('component:drag:start', onDragStart);
  editor.on('block:drag:start', onDragStart);

  return () => {
    editor.off('sorter:drag:start', onDragStart);
    editor.off('component:drag:start', onDragStart);
    editor.off('block:drag:start', onDragStart);
  };
}
