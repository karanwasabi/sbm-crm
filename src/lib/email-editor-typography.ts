import type { Component, Editor } from 'grapesjs';
import { isMjmlTextComponent, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';
import {
  canonicalizeEditable,
  clearEmailRichFormatting,
  insertEmailLineBreak,
  insertTextWithMarks,
  marksAtCaret,
  marksEqual,
  sanitizeEmailRichHtml,
  selectionFullyHasMark,
  toggleEmailMark,
  type EmailInlineMarks,
  type EmailMark,
} from '@/lib/email-rich-text';
import { EMAIL_BODY_TEXT_MJML_ATTRS, EMAIL_BODY_TYPOGRAPHY } from '@/lib/email-typography-tokens';

export { clearEmailRichFormatting, sanitizeEmailRichHtml } from '@/lib/email-rich-text';

export { EMAIL_BODY_TEXT_MJML_ATTRS, EMAIL_BODY_TYPOGRAPHY };

const BODY_STYLE_DEFAULT = {
  'font-size': EMAIL_BODY_TYPOGRAPHY.fontSize,
  color: EMAIL_BODY_TYPOGRAPHY.color,
  'line-height': EMAIL_BODY_TYPOGRAPHY.lineHeight,
  'font-family': EMAIL_BODY_TYPOGRAPHY.fontFamily,
  'padding-top': '8px',
  'padding-bottom': '8px',
  'padding-left': '25px',
  'padding-right': '25px',
  align: 'left',
} as const;

const BUTTON_STYLE_DEFAULT = {
  'background-color': '#0f766e',
  color: '#ffffff',
  'border-radius': '999px',
  'font-size': '15px',
  'font-weight': '600',
  'font-family': 'Helvetica, Arial, sans-serif',
  'padding-top': '12px',
  'padding-bottom': '12px',
  'padding-left': '24px',
  'padding-right': '24px',
  align: 'center',
} as const;

function escapePlainTextForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function insertSanitizedHtmlAtSelection(doc: Document, html: string, editable: HTMLElement) {
  const selection = doc.getSelection();
  if (!selection || !selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  if (!editable.contains(range.commonAncestorContainer)) return false;

  // Prefer execCommand so the browser fires `input` and Grapes' RTE onInput/undo hooks run.
  try {
    if (doc.execCommand('insertHTML', false, html)) {
      editable.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  } catch {
    // fall through to manual insert
  }

  range.deleteContents();
  const template = doc.createElement('template');
  template.innerHTML = html;
  const fragment = template.content;
  const last = fragment.lastChild;
  range.insertNode(fragment);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  editable.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

const TYPOGRAPHY_ATTR_KEYS = ['font-family', 'font-size', 'color', 'line-height'] as const;

export type MjmlTextTypography = Partial<Record<(typeof TYPOGRAPHY_ATTR_KEYS)[number], string>>;

function readAttrOrStyle(component: Component, key: (typeof TYPOGRAPHY_ATTR_KEYS)[number]): string {
  const attrs = component.getAttributes?.() ?? {};
  const fromAttr = String(attrs[key] ?? '').trim();
  if (fromAttr) return fromAttr;
  const style = (component.getStyle?.() ?? {}) as Record<string, string>;
  return String(style[key] ?? '').trim();
}

/**
 * Resolve typography from existing mj-text attrs/styles only — never inject body defaults
 * onto loaded templates (that is what made Georgia/Ubuntu blocks jump to Helvetica on select).
 */
export function readMjmlTextTypography(component: Component): MjmlTextTypography {
  const out: MjmlTextTypography = {};
  for (const key of TYPOGRAPHY_ATTR_KEYS) {
    const value = readAttrOrStyle(component, key);
    if (value) out[key] = value;
  }
  return out;
}

/** Keep MJML attributes as the source of truth when style manager mirrored values onto style. */
export function preserveMjmlTextTypographyAttrs(component: Component): MjmlTextTypography {
  const typography = readMjmlTextTypography(component);
  if (!isMjmlTextComponent(component) || Object.keys(typography).length === 0) {
    return typography;
  }

  const attrs = { ...(component.getAttributes?.() ?? {}) };
  let changed = false;
  for (const key of TYPOGRAPHY_ATTR_KEYS) {
    const value = typography[key];
    if (!value) continue;
    if (String(attrs[key] ?? '').trim() !== value) {
      attrs[key] = value;
      changed = true;
    }
  }
  if (changed) {
    component.setAttributes(attrs);
  }
  return typography;
}

/** Paint resolved typography onto the contenteditable host so RTE matches the block. */
export function applyMjmlTextTypographyToEditable(
  component: Component,
  editable: HTMLElement | null | undefined
): MjmlTextTypography {
  const typography = preserveMjmlTextTypographyAttrs(component);
  if (!editable) return typography;
  if (typography['font-family']) editable.style.fontFamily = typography['font-family'];
  if (typography['font-size']) editable.style.fontSize = typography['font-size'];
  if (typography.color) editable.style.color = typography.color;
  if (typography['line-height']) editable.style.lineHeight = typography['line-height'];
  return typography;
}

function getEditableFromView(view: {
  model?: Component;
  getChildrenContainer?: () => HTMLElement | null;
  el?: HTMLElement;
  rteEnabled?: boolean;
}): HTMLElement | null {
  if (!view?.model || !isMjmlTextComponent(view.model)) return null;
  return (
    view.getChildrenContainer?.() ??
    (view.el?.querySelector?.('[contenteditable="true"]') as HTMLElement | null) ??
    (view.el?.querySelector?.('td > div, td div') as HTMLElement | null) ??
    view.el ??
    null
  );
}

function getActiveEditableElement(editor: Editor): HTMLElement | null {
  const currentView = editor.RichTextEditor.model.get('currentView') as
    | { model?: Component; getChildrenContainer?: () => HTMLElement | null; el?: HTMLElement; rteEnabled?: boolean }
    | undefined;
  if (!currentView?.rteEnabled) return null;
  return getEditableFromView(currentView);
}

export function installEmailEditorTypography(editor: Editor): () => void {
  // Padding/align only in style-default — never force Helvetica onto existing templates.
  const textStyleDefault = {
    'padding-top': BODY_STYLE_DEFAULT['padding-top'],
    'padding-bottom': BODY_STYLE_DEFAULT['padding-bottom'],
    'padding-left': BODY_STYLE_DEFAULT['padding-left'],
    'padding-right': BODY_STYLE_DEFAULT['padding-right'],
    align: BODY_STYLE_DEFAULT.align,
  } as const;

  editor.Components.addType('mj-text', {
    model: {
      defaults: {
        'style-default': { ...textStyleDefault },
        highlightable: true,
      },
    },
  });

  editor.Components.addType('mj-button', {
    model: {
      defaults: {
        'style-default': { ...BUTTON_STYLE_DEFAULT },
        highlightable: true,
      },
    },
  });

  // Clear-format RTE action
  const rte = editor.RichTextEditor;
  rte.add('clear-format', {
    icon: '<b style="font-weight:400;text-decoration:line-through">T</b>',
    attributes: { title: 'Clear formatting' },
    result: () => {
      const doc = editor.Canvas.getDocument();
      const selection = doc?.getSelection();
      if (!doc || !selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        // Clear whole active text component
        const component = editor.getSelected();
        if (component && isMjmlTextComponent(component)) {
          const html = clearEmailRichFormatting(component.getInnerHTML?.() || String(component.get('content') || ''));
          reconcileMjmlTextComponent(component, { forceHtml: html || ' ' });
        }
        return;
      }

      const container = range.commonAncestorContainer;
      const host = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;
      if (!host) return;

      const wrapper = doc.createElement('div');
      wrapper.appendChild(range.cloneContents());
      const cleaned = clearEmailRichFormatting(wrapper.innerHTML);
      range.deleteContents();
      const template = doc.createElement('template');
      template.innerHTML = cleaned;
      range.insertNode(template.content);
    },
  });

  type RteSession = {
    el?: HTMLElement;
    doc?: Document;
    updateActiveActions?: () => void;
  };
  let activeRte: RteSession | null = null;
  let pendingMarks: EmailInlineMarks | null = null;
  let pendingAnchor: { node: Node; offset: number } | null = null;
  let suppressSelection = 0;

  const refreshToolbar = () => {
    activeRte?.updateActiveActions?.();
  };

  const editableFor = (session?: RteSession | null): HTMLElement | null =>
    session?.el ?? getActiveEditableElement(editor);

  const markButtonState = (session: RteSession, doc: Document, mark: EmailMark): number => {
    const editable = editableFor(session);
    if (!editable) return 0;
    const selection = doc.getSelection();
    const collapsed = !selection?.rangeCount || selection.getRangeAt(0).collapsed;
    if (pendingMarks && collapsed) return pendingMarks[mark] ? 1 : 0;
    return selectionFullyHasMark(editable, doc, mark) ? 1 : 0;
  };

  const rememberPending = (doc: Document, marks: EmailInlineMarks | null) => {
    pendingMarks = marks;
    const selection = doc.getSelection();
    if (!marks || !selection?.rangeCount) {
      pendingAnchor = null;
      return;
    }
    const range = selection.getRangeAt(0);
    pendingAnchor = { node: range.startContainer, offset: range.startOffset };
  };

  const runToggle = (session: RteSession, mark: EmailMark) => {
    const doc = session.doc ?? session.el?.ownerDocument ?? editor.Canvas.getDocument();
    const editable = editableFor(session);
    if (!doc || !editable) return;
    activeRte = session;
    suppressSelection += 1;
    try {
      const range = doc.getSelection()?.rangeCount ? doc.getSelection()?.getRangeAt(0) : null;
      if (range?.collapsed) {
        if (canonicalizeEditable(editable)) {
          editable.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const natural = marksAtCaret(editable, doc);
        const base = pendingMarks ?? natural;
        const next: EmailInlineMarks = { ...base, [mark]: !base[mark] };
        rememberPending(doc, marksEqual(next, natural) ? null : next);
        return;
      }
      rememberPending(doc, null);
      toggleEmailMark(editable, doc, mark);
    } finally {
      suppressSelection -= 1;
      refreshToolbar();
    }
  };

  for (const mark of ['bold', 'italic', 'underline'] as const) {
    const action = rte.get(mark);
    if (!action) continue;
    action.result = (session) => runToggle(session as RteSession, mark);
    action.state = (session, doc) => markButtonState(session, doc, mark);
  }

  const onPaste = (event: ClipboardEvent) => {
    // Only sanitize when a text component is actively being edited. Otherwise let Grapes
    // handle component paste / ignore the event — preventingDefault while idle locked the canvas.
    const editable = getActiveEditableElement(editor);
    if (!editable) return;
    const target = event.target;
    if (!(target instanceof Node) || !editable.contains(target)) return;

    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!html && !text) return;

    event.preventDefault();
    event.stopPropagation();

    const doc = editor.Canvas.getDocument();
    if (!doc) return;

    const sanitized = html ? sanitizeEmailRichHtml(html) : escapePlainTextForHtml(text).replace(/\r\n|\r|\n/g, '<br>');
    if (!sanitized) return;

    rememberPending(doc, null);
    insertSanitizedHtmlAtSelection(doc, sanitized, editable);
  };

  let enterFromKey = false;

  const onBeforeInput = (event: InputEvent) => {
    if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
      const alreadyInserted = enterFromKey;
      enterFromKey = false;
      const editable = getActiveEditableElement(editor);
      const doc = editor.Canvas.getDocument();
      const target = event.target;
      if (!editable || !doc || !(target instanceof Node) || !editable.contains(target)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!alreadyInserted && !event.isComposing) insertEmailLineBreak(editable, doc);
      return;
    }
    if (!pendingMarks || event.isComposing || event.inputType !== 'insertText' || !event.data) return;
    const editable = getActiveEditableElement(editor);
    const doc = editor.Canvas.getDocument();
    if (!editable || !doc) return;
    const target = event.target;
    if (!(target instanceof Node) || !editable.contains(target)) return;
    const natural = marksAtCaret(editable, doc);
    if (marksEqual(pendingMarks, natural)) {
      rememberPending(doc, null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    suppressSelection += 1;
    try {
      insertTextWithMarks(editable, doc, event.data, pendingMarks);
      rememberPending(doc, null);
    } finally {
      suppressSelection -= 1;
      refreshToolbar();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.isComposing && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const editable = getActiveEditableElement(editor);
      const doc = editor.Canvas.getDocument();
      const target = event.target;
      if (editable && doc && target instanceof Node && editable.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
        enterFromKey = true;
        insertEmailLineBreak(editable, doc);
        setTimeout(() => {
          enterFromKey = false;
        }, 0);
        return;
      }
    }
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const markByKey: Record<string, EmailMark> = { b: 'bold', i: 'italic', u: 'underline' };
    const mark = markByKey[event.key.toLowerCase()];
    if (!mark) return;
    const editable = getActiveEditableElement(editor);
    const doc = editor.Canvas.getDocument();
    const session = activeRte;
    if (!editable || !doc || !session) return;
    const target = event.target;
    if (!(target instanceof Node) || !editable.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
    runToggle(session, mark);
  };

  const onSelectionChange = () => {
    if (suppressSelection || !pendingMarks || !pendingAnchor) return;
    const doc = editor.Canvas.getDocument();
    const selection = doc?.getSelection();
    if (!selection?.rangeCount) {
      rememberPending(doc ?? pendingAnchor.node.ownerDocument!, null);
      refreshToolbar();
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.startContainer !== pendingAnchor.node || range.startOffset !== pendingAnchor.offset) {
      rememberPending(range.startContainer.ownerDocument ?? doc!, null);
      refreshToolbar();
    }
  };

  let editingDoc: Document | null = null;
  const attachEditing = () => {
    if (editingDoc) {
      editingDoc.removeEventListener('paste', onPaste, true);
      editingDoc.removeEventListener('beforeinput', onBeforeInput, true);
      editingDoc.removeEventListener('keydown', onKeyDown, true);
      editingDoc.removeEventListener('selectionchange', onSelectionChange, true);
      editingDoc = null;
    }
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    doc.addEventListener('paste', onPaste, true);
    doc.addEventListener('beforeinput', onBeforeInput, true);
    doc.addEventListener('keydown', onKeyDown, true);
    doc.addEventListener('selectionchange', onSelectionChange, true);
    editingDoc = doc;
  };
  const detachEditing = () => {
    if (!editingDoc) return;
    editingDoc.removeEventListener('paste', onPaste, true);
    editingDoc.removeEventListener('beforeinput', onBeforeInput, true);
    editingDoc.removeEventListener('keydown', onKeyDown, true);
    editingDoc.removeEventListener('selectionchange', onSelectionChange, true);
    editingDoc = null;
  };

  const syncTypographyForComponent = (component: Component | undefined) => {
    if (!component || !isMjmlTextComponent(component)) return;
    const typography = preserveMjmlTextTypographyAttrs(component);
    if (Object.keys(typography).length === 0) return;
    const view = component.view as
      | { getChildrenContainer?: () => HTMLElement | null; el?: HTMLElement; rteEnabled?: boolean; model?: Component }
      | undefined;
    if (view?.rteEnabled) {
      applyMjmlTextTypographyToEditable(component, getEditableFromView({ ...view, model: component }));
    }
  };

  const onRteEnable = (...args: unknown[]) => {
    const eventView = args[0] as
      | { model?: Component; getChildrenContainer?: () => HTMLElement | null; el?: HTMLElement; rteEnabled?: boolean }
      | undefined;
    const component =
      eventView?.model ??
      (editor.RichTextEditor.model.get('currentView') as { model?: Component } | undefined)?.model ??
      editor.getSelected() ??
      undefined;
    if (!component || !isMjmlTextComponent(component)) return;

    activeRte = (args[1] as RteSession | undefined) ?? activeRte;
    const apply = () => {
      const live = editor.RichTextEditor.model.get('currentView') as
        | { model?: Component; getChildrenContainer?: () => HTMLElement | null; el?: HTMLElement; rteEnabled?: boolean }
        | undefined;
      const target = live?.model ?? component;
      const editable = getEditableFromView(live ?? { model: target, ...eventView });
      if (editable && canonicalizeEditable(editable)) {
        editable.dispatchEvent(new Event('input', { bubbles: true }));
      }
      applyMjmlTextTypographyToEditable(target, editable);
    };
    apply();
    window.setTimeout(apply, 0);
  };

  const onComponentSelected = (component: Component) => {
    syncTypographyForComponent(component);
  };

  const onRteDisable = (view?: { model?: Component } | Component) => {
    pendingMarks = null;
    pendingAnchor = null;
    activeRte = null;
    const component = view && 'model' in view ? view.model : ((view as Component | undefined) ?? editor.getSelected());
    if (component && isMjmlTextComponent(component)) {
      preserveMjmlTextTypographyAttrs(component);
      reconcileMjmlTextComponent(component);
    }
  };

  editor.on('canvas:frame:load', attachEditing);
  editor.on('load', attachEditing);
  editor.on('rte:enable', onRteEnable as never);
  editor.on('rte:disable', onRteDisable as never);
  editor.on('component:selected', onComponentSelected);
  attachEditing();

  return () => {
    editor.off('canvas:frame:load', attachEditing);
    editor.off('load', attachEditing);
    editor.off('rte:enable', onRteEnable as never);
    editor.off('rte:disable', onRteDisable as never);
    editor.off('component:selected', onComponentSelected);
    detachEditing();
    try {
      rte.remove('clear-format');
    } catch {
      // ignore
    }
  };
}
