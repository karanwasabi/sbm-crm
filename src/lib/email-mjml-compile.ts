import type { Component, Editor } from 'grapesjs';

/** MJML text blocks that grapesjs-mjml serializes via `content` + child nodes. */
const MJML_TEXT_TYPES = new Set(['mj-text', 'mj-button', 'text']);

const SILENT_CONTENT_OPTS = { fromDisable: true, silent: true } as const;

type ContentBlankSnapshot = {
  component: Component;
  content: unknown;
};

let compileDepth = 0;

export function isCompilingEditorHtml(): boolean {
  return compileDepth > 0;
}

function isMjmlTextComponent(component: Component): boolean {
  const type = component.get('type') as string;
  return MJML_TEXT_TYPES.has(type) || component.is('text');
}

function isRteActive(component: Component): boolean {
  const view = component.view as { rteEnabled?: boolean } | undefined;
  return !!view?.rteEnabled;
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
