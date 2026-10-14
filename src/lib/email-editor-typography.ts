import type { Component, Editor } from 'grapesjs';
import { ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';
import { isMjmlTextComponent, reconcileMjmlTextComponent } from '@/lib/email-mjml-compile';

const BODY_STYLE_DEFAULT = {
  'font-size': '16px',
  color: '#475569',
  'line-height': '1.6',
  'font-family': 'Helvetica, Arial, sans-serif',
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

  const walk = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName;

    // Unwrap disallowed tags, keep children, then sanitize those children.
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) return;
      const moved: Node[] = [];
      while (el.firstChild) {
        const child = el.firstChild;
        parent.insertBefore(child, el);
        moved.push(child);
      }
      parent.removeChild(el);
      moved.forEach(walk);
      return;
    }

    // Normalize semantic tags
    if (tag === 'STRONG') {
      renameElement(el, 'b');
    } else if (tag === 'EM') {
      renameElement(el, 'i');
    } else if (tag === 'SPAN') {
      const weight = el.style.fontWeight;
      const isBold = weight === 'bold' || Number(weight) >= 600;
      const isItalic = el.style.fontStyle === 'italic';
      const isUnderline = (el.style.textDecoration || '').includes('underline');
      if (isBold || isItalic || isUnderline) {
        let current: HTMLElement = el;
        if (isBold) current = wrapWith(current, 'b');
        if (isItalic) current = wrapWith(current, 'i');
        if (isUnderline) current = wrapWith(current, 'u');
        // unwrap span
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }
      // plain span → unwrap
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      return;
    } else if (tag === 'P' || tag === 'DIV') {
      // Convert block wrappers to line breaks between content
      const parent = el.parentNode;
      if (parent) {
        if (el.previousSibling) {
          parent.insertBefore(doc.createElement('br'), el);
        }
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      return;
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

function renameElement(el: HTMLElement, tagName: string) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.parentNode?.replaceChild(next, el);
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

function insertSanitizedHtmlAtSelection(doc: Document, html: string) {
  const selection = doc.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
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
    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!html && !text) return;

    event.preventDefault();
    event.stopPropagation();

    const doc = editor.Canvas.getDocument();
    if (!doc) return;

    const sanitized = html ? sanitizeEmailRichHtml(html) : text.replace(/\r\n|\r|\n/g, '<br>');

    insertSanitizedHtmlAtSelection(doc, sanitized);

    const component = editor.getSelected();
    if (component && isMjmlTextComponent(component)) {
      const el =
        (component.view as { getChildrenContainer?: () => HTMLElement } | undefined)?.getChildrenContainer?.() ??
        component.getEl?.();
      const live = el?.innerHTML?.trim();
      if (live) {
        // Keep model roughly in sync without freezing RTE mid-edit
        component.set('content', '', { silent: true } as never);
      }
    }
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
