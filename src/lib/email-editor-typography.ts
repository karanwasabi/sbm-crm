import type { Component, Editor } from 'grapesjs';
import { ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';
import { isMjmlTextComponent, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';
import { EMAIL_BODY_TEXT_MJML_ATTRS, EMAIL_BODY_TYPOGRAPHY } from '@/lib/email-typography-tokens';

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

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'P', 'DIV', 'SPAN']);
const DROP_WITH_CONTENT = new Set([
  'STYLE',
  'SCRIPT',
  'META',
  'LINK',
  'TITLE',
  'XML',
  'HEAD',
  'IMG',
  'NOSCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
]);

/** Sanitize pasted / RTE HTML down to email-safe inline formatting. */
export function sanitizeEmailRichHtml(raw: string): string {
  if (!raw.trim()) return '';

  // Prefer DOM parsing in browser; fall back to regex strip for vitest/node.
  if (typeof DOMParser === 'undefined') {
    return sanitizeEmailRichHtmlFallback(raw);
  }

  const doc = new DOMParser().parseFromString(`<div id="sbm-root">${raw}</div>`, 'text/html');
  const root = doc.getElementById('sbm-root');
  if (!root) return sanitizeEmailRichHtmlFallback(raw);

  const unwrapKeepingChildren = (el: HTMLElement): Node[] => {
    const parent = el.parentNode;
    if (!parent) return [];
    const moved: Node[] = [];
    while (el.firstChild) {
      const child = el.firstChild;
      parent.insertBefore(child, el);
      moved.push(child);
    }
    parent.removeChild(el);
    return moved;
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName;

    if (DROP_WITH_CONTENT.has(tag) || tag.includes(':')) {
      el.parentNode?.removeChild(el);
      return;
    }

    // Unwrap disallowed tags, keep children, then sanitize those children.
    if (!ALLOWED_TAGS.has(tag)) {
      unwrapKeepingChildren(el).forEach(walk);
      return;
    }

    // Normalize semantic tags
    if (tag === 'STRONG') {
      walk(renameElement(el, 'b'));
      return;
    }
    if (tag === 'EM') {
      walk(renameElement(el, 'i'));
      return;
    }
    if (tag === 'SPAN') {
      const weight = el.style.fontWeight;
      const isBold = weight === 'bold' || Number(weight) >= 600;
      const isItalic = el.style.fontStyle === 'italic';
      const isUnderline = (el.style.textDecoration || '').includes('underline');
      if (isBold || isItalic || isUnderline) {
        let current: HTMLElement = el;
        if (isBold) current = wrapWith(current, 'b');
        if (isItalic) current = wrapWith(current, 'i');
        if (isUnderline) current = wrapWith(current, 'u');
        unwrapKeepingChildren(el).forEach(walk);
        return;
      }
      unwrapKeepingChildren(el).forEach(walk);
      return;
    }
    if (tag === 'P' || tag === 'DIV') {
      const parent = el.parentNode;
      if (parent && el.previousSibling) {
        parent.insertBefore(doc.createElement('br'), el);
      }
      unwrapKeepingChildren(el).forEach(walk);
      return;
    }

    // Google Docs wraps the paste in <b style="font-weight:normal" id="docs-internal-guid-…">
    if (tag === 'B') {
      const id = el.getAttribute('id') || '';
      const weight = (el.style.fontWeight || '').toLowerCase();
      if (id.startsWith('docs-internal-guid') || weight === 'normal' || weight === '400') {
        unwrapKeepingChildren(el).forEach(walk);
        return;
      }
    }

    // Strip all attributes except href/target/rel on anchors
    if (tag === 'A') {
      const href = el.getAttribute('href') || '';
      [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
      if (href) el.setAttribute('href', href);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    } else {
      [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
    }

    // Recurse children (copy list — mutation-safe)
    [...el.childNodes].forEach(walk);
  };

  [...root.childNodes].forEach(walk);
  const html = root.innerHTML;
  return ensureEmailLinksOpenInNewTab(html);
}

function renameElement(el: HTMLElement, tagName: string): HTMLElement {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.parentNode?.replaceChild(next, el);
  return next;
}

function wrapWith(el: HTMLElement, tagName: string): HTMLElement {
  const doc = el.ownerDocument;
  const wrapper = doc.createElement(tagName);
  while (el.firstChild) wrapper.appendChild(el.firstChild);
  el.appendChild(wrapper);
  return wrapper;
}

function sanitizeEmailRichHtmlFallback(raw: string): string {
  let html = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:font|o:p|meta|style|script)[^>]*>/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<strong\b[^>]*>/gi, '<b>')
    .replace(/<\/strong>/gi, '</b>')
    .replace(/<em\b[^>]*>/gi, '<i>')
    .replace(/<\/em>/gi, '</i>')
    .replace(/<\/?p\b[^>]*>/gi, '<br>')
    .replace(/<\/?div\b[^>]*>/gi, '<br>')
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  // Drop tags that aren't in the allowlist
  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tag: string) => {
    const upper = tag.toUpperCase();
    if (['B', 'I', 'U', 'A', 'BR'].includes(upper)) {
      if (upper === 'A') {
        const href = match.match(/href\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
        if (match.startsWith('</')) return '</a>';
        return href
          ? `<a href="${href}" target="_blank" rel="noopener noreferrer">`
          : '<a target="_blank" rel="noopener noreferrer">';
      }
      if (upper === 'BR') return '<br>';
      return match.startsWith('</') ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`;
    }
    return '';
  });

  return ensureEmailLinksOpenInNewTab(html);
}

/** Clear inline formatting markers from an HTML fragment. */
export function clearEmailRichFormatting(raw: string): string {
  const sanitized = sanitizeEmailRichHtml(raw);
  return sanitized
    .replace(/<\/?(?:b|strong|i|em|u)\b[^>]*>/gi, '')
    .replace(/<span\b[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');
}

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

function getActiveEditableElement(editor: Editor): HTMLElement | null {
  const currentView = editor.RichTextEditor.model.get('currentView') as
    | { model?: Component; getChildrenContainer?: () => HTMLElement | null; el?: HTMLElement; rteEnabled?: boolean }
    | undefined;
  if (!currentView?.rteEnabled || !currentView.model || !isMjmlTextComponent(currentView.model)) {
    return null;
  }
  return (
    currentView.getChildrenContainer?.() ??
    (currentView.el?.querySelector?.('[contenteditable="true"]') as HTMLElement | null) ??
    currentView.el ??
    null
  );
}

export function installEmailEditorTypography(editor: Editor): () => void {
  editor.Components.addType('mj-text', {
    model: {
      defaults: {
        'style-default': { ...BODY_STYLE_DEFAULT },
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

    insertSanitizedHtmlAtSelection(doc, sanitized, editable);
  };

  let pasteDoc: Document | null = null;
  const attachPaste = () => {
    if (pasteDoc) {
      pasteDoc.removeEventListener('paste', onPaste, true);
      pasteDoc = null;
    }
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    doc.addEventListener('paste', onPaste, true);
    pasteDoc = doc;
  };
  const detachPaste = () => {
    if (pasteDoc) {
      pasteDoc.removeEventListener('paste', onPaste, true);
      pasteDoc = null;
    }
  };

  const onRteDisable = (view?: { model?: Component } | Component) => {
    const component = view && 'model' in view ? view.model : ((view as Component | undefined) ?? editor.getSelected());
    if (component && isMjmlTextComponent(component)) {
      reconcileMjmlTextComponent(component);
    }
  };

  editor.on('canvas:frame:load', attachPaste);
  editor.on('load', attachPaste);
  editor.on('rte:disable', onRteDisable as never);
  attachPaste();

  return () => {
    editor.off('canvas:frame:load', attachPaste);
    editor.off('load', attachPaste);
    editor.off('rte:disable', onRteDisable as never);
    detachPaste();
    try {
      rte.remove('clear-format');
    } catch {
      // ignore
    }
  };
}
