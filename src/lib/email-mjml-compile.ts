import type { Component, Editor } from 'grapesjs';
import { ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';

/** MJML text blocks that grapesjs-mjml serializes via `content` + child nodes. */
const MJML_TEXT_TYPES = new Set(['mj-text', 'mj-button', 'text']);

const SILENT_CONTENT_OPTS = { fromDisable: true, silent: true } as const;
const RTE_SYNC_OPTS = { fromDisable: true } as const;

type ContentBlankSnapshot = {
  component: Component;
  content: unknown;
};

type ReconcileMjmlTextOptions = {
  fallbackHtml?: string;
  forceHtml?: string;
};

let compileDepth = 0;

export function isCompilingEditorHtml(): boolean {
  return compileDepth > 0;
}

export function isMjmlTextComponent(component: Component): boolean {
  const type = component.get('type') as string;
  return MJML_TEXT_TYPES.has(type) || component.is('text');
}

function isRteActive(component: Component): boolean {
  const view = component.view as { rteEnabled?: boolean } | undefined;
  return !!view?.rteEnabled;
}

function readStoredContent(component: Component): string {
  const content = component.get('content');
  return typeof content === 'string' ? content.trim() : '';
}

function readChildTextNodes(component: Component): string {
  return component
    .components()
    .models.map((child: Component) => {
      if (child.get('type') === 'textnode') {
        return String(child.get('content') ?? '');
      }
      return '';
    })
    .join('')
    .trim();
}

/** Best-effort HTML for an MJML text block (DOM/children/content/fallback). */
export function readMjmlTextHtml(component: Component, fallbackHtml?: string): string {
  try {
    const inner = component.getInnerHTML();
    if (typeof inner === 'string' && inner.trim()) {
      return inner.trim();
    }
  } catch {
    // Fall through.
  }

  const view = component.view as { getChildrenContainer?: () => HTMLElement; el?: HTMLElement } | undefined;
  const el = view?.getChildrenContainer?.() ?? view?.el?.querySelector('td > div, td div, a, p');
  if (el) {
    const html = el.innerHTML.trim();
    if (html) {
      return html;
    }
    const text = el.textContent?.trim() ?? '';
    if (text) {
      return text;
    }
  }

  const stored = readStoredContent(component);
  if (stored) {
    return stored;
  }

  const childText = readChildTextNodes(component);
  if (childText) {
    return childText;
  }

  return fallbackHtml?.trim() ?? '';
}

export function isMjmlTextComponentVisuallyBlank(component: Component): boolean {
  const html = readMjmlTextHtml(component);
  if (!html) {
    return true;
  }

  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0 && !/<(img|br)\b/i.test(html);
}

/**
 * Rebuild MJML text children from a single HTML source so canvas + compile stay in sync.
 * Used after RTE link edits and inline link trait changes.
 */
export function reconcileMjmlTextComponent(component: Component, options: ReconcileMjmlTextOptions = {}): boolean {
  if (!isMjmlTextComponent(component) || isRteActive(component)) {
    return false;
  }

  const raw =
    options.forceHtml?.trim() ||
    readMjmlTextHtml(component, options.fallbackHtml) ||
    options.fallbackHtml?.trim() ||
    '';
  if (!raw) {
    return false;
  }

  const normalized = ensureEmailLinksOpenInNewTab(raw);
  const needsReconcile =
    isMjmlTextComponentVisuallyBlank(component) ||
    componentHasDualTextExport(component) ||
    (readStoredContent(component).length > 0 && readStoredContent(component) !== normalized);

  if (!needsReconcile && options.forceHtml === undefined) {
    return false;
  }

  component.set('content', '', SILENT_CONTENT_OPTS);
  component.components().resetFromString(normalized, RTE_SYNC_OPTS as never);
  component.view?.render?.();

  // Safety: if a forced rewrite somehow left the block blank, fall back to content HTML.
  if (options.forceHtml !== undefined && isMjmlTextComponentVisuallyBlank(component)) {
    component.set('content', normalized, SILENT_CONTENT_OPTS);
    component.view?.render?.();
  }

  return true;
}

export function reconcileAllMjmlTextComponents(editor: Editor) {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return;
  }

  for (const type of ['mj-text', 'mj-button', 'text'] as const) {
    for (const component of wrapper.findType(type)) {
      reconcileMjmlTextComponent(component);
    }
  }
}

/**
 * grapesjs-mjml `toHTML` concatenates `component.get('content')` with child exports.
 * After RTE edits both can be populated while the canvas still renders correctly from children.
 */
export function componentHasDualTextExport(component: Component): boolean {
  if (component.components().length === 0) {
    return false;
  }

  const content = component.get('content');
  return typeof content === 'string' && content.trim().length > 0;
}

function collectContentBlankSnapshots(editor: Editor): ContentBlankSnapshot[] {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return [];
  }

  const snapshots: ContentBlankSnapshot[] = [];

  for (const type of ['mj-text', 'mj-button', 'text'] as const) {
    for (const component of wrapper.findType(type)) {
      if (!isMjmlTextComponent(component) || isRteActive(component)) {
        continue;
      }

      if (!componentHasDualTextExport(component)) {
        continue;
      }

      snapshots.push({
        component,
        content: component.get('content'),
      });
    }
  }

  return snapshots;
}

function applyContentBlankSnapshots(snapshots: ContentBlankSnapshot[]) {
  for (const snapshot of snapshots) {
    snapshot.component.set('content', '', SILENT_CONTENT_OPTS);
  }
}

function restoreContentBlankSnapshots(snapshots: ContentBlankSnapshot[]) {
  for (const snapshot of snapshots) {
    snapshot.component.set('content', snapshot.content as string | undefined, SILENT_CONTENT_OPTS);
  }
}

/**
 * Compile MJML to HTML for preview/save. Temporarily blanks duplicate `content` props so export
 * uses child nodes only, then restores — canvas/DOM is untouched (no child reset).
 */
export function compileEditorHtmlWithDedupe(editor: Editor, runCompile: () => string): string {
  if (compileDepth > 0) {
    return runCompile();
  }

  const snapshots = collectContentBlankSnapshots(editor);
  if (snapshots.length === 0) {
    return runCompile();
  }

  compileDepth += 1;
  const undo = editor.UndoManager;
  undo.stop();

  try {
    applyContentBlankSnapshots(snapshots);
    return runCompile();
  } finally {
    restoreContentBlankSnapshots(snapshots);
    undo.start();
    compileDepth -= 1;
  }
}
