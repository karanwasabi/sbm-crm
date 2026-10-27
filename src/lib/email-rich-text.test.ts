/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';
import {
  applyEmailMark,
  canonicalizeEditable,
  insertTextWithMarks,
  sanitizeEmailRichHtml,
  selectionFullyHasMark,
  toggleEmailMark,
} from './email-rich-text';

const DOCS_PASTE = `
<b style="font-weight:normal;" id="docs-internal-guid-abc">
  <p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
    <span style="font-size:11pt;font-family:Arial,sans-serif;font-weight:400;font-style:normal;text-decoration:none;">Hello </span>
    <span style="font-size:11pt;font-family:Arial,sans-serif;font-weight:700;font-style:normal;text-decoration:none;">bold</span>
    <span style="font-size:11pt;font-family:Arial,sans-serif;font-weight:400;font-style:italic;text-decoration:underline;"> end</span>
  </p>
</b>`;

function editableWith(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function selectTextNode(root: HTMLElement, text: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.textContent === text) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    node = walker.nextNode();
  }
  throw new Error(`text node not found: ${text}`);
}

function selectOffsets(root: HTMLElement, start: number, end: number) {
  const point = (target: number) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let seen = 0;
    let node = walker.nextNode();
    while (node) {
      const length = node.textContent?.length ?? 0;
      if (seen + length >= target) return { node, offset: target - seen };
      seen += length;
      node = walker.nextNode();
    }
    return { node: root, offset: root.childNodes.length };
  };
  const range = document.createRange();
  const from = point(start);
  const to = point(end);
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

describe('sanitizeEmailRichHtml', () => {
  it('resolves mixed pasted styles without treating the wrapper as bold', () => {
    expect(sanitizeEmailRichHtml(DOCS_PASTE)).toBe('Hello <b>bold</b><i><u> end</u></i>');
  });

  it('reads bold from a stylesheet class', () => {
    const html = `<html><head><style>.plain{font-weight:400}.heavy{font-weight:700}</style></head><body><span class="plain">Hi </span><span class="heavy">there</span></body></html>`;
    expect(sanitizeEmailRichHtml(html)).toBe('Hi <b>there</b>');
  });

  it('lets a class override a bold tag', () => {
    const html = `<style>.n{font-weight:400}</style><b class="n">nope</b>`;
    expect(sanitizeEmailRichHtml(html)).toBe('nope');
  });

  it('turns styled spans into marks and stays stable', () => {
    const once = sanitizeEmailRichHtml(
      '<span style="font-size: 28px; font-family: Comic Sans; font-weight: bold">Pasted</span>'
    );
    expect(once).toBe('<b>Pasted</b>');
    expect(sanitizeEmailRichHtml(once)).toBe(once);
  });

  it('canonicalizes a live editable once', () => {
    const root = editableWith(DOCS_PASTE);
    expect(canonicalizeEditable(root)).toBe(true);
    const cleaned = root.innerHTML;
    expect(cleaned).toContain('<b>bold</b>');
    expect(cleaned).not.toContain('docs-internal-guid');
    expect(canonicalizeEditable(root)).toBe(false);
    expect(root.innerHTML).toBe(cleaned);
  });

  it('resolves a docs clipboard that sets weight on classes and pre-wrap spans', () => {
    const html = `<html><head><style>
      .c0{font-weight:400;font-style:normal;text-decoration:none}
      .c1{font-weight:700;font-style:normal;text-decoration:none}
      .c2{font-weight:400;font-style:italic;text-decoration:underline}
    </style></head><body><b style="font-weight:normal;" id="docs-internal-guid-123"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span class="c0" style="white-space:pre;white-space:pre-wrap;">Hello </span><span class="c1" style="white-space:pre;white-space:pre-wrap;">bold</span><span class="c2" style="white-space:pre;white-space:pre-wrap;"> end</span></p></b></body></html>`;
    expect(sanitizeEmailRichHtml(html)).toBe('Hello <b>bold</b><i><u> end</u></i>');
  });

  it('keeps a docs selection on the bold word while resolving paste markup', () => {
    const root = editableWith(DOCS_PASTE);
    selectTextNode(root, 'bold');
    expect(canonicalizeEditable(root)).toBe(true);
    expect(document.getSelection()?.toString()).toBe('bold');
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('Hello bold<i><u> end</u></i>');
  });
});

describe('email mark toggle', () => {
  it('bolds an unstyled selection and removes that bold again', () => {
    const root = editableWith('Hello world');
    selectOffsets(root, 6, 11);
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('Hello <b>world</b>');

    selectOffsets(root, 6, 11);
    expect(selectionFullyHasMark(root, document, 'bold')).toBe(true);
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('Hello world');
  });

  it('unbolds part of a bold word', () => {
    const root = editableWith('<b>hello</b>');
    selectOffsets(root, 1, 4);
    expect(applyEmailMark(root, document, 'bold', false)).toBe(true);
    expect(root.innerHTML).toBe('<b>h</b>ell<b>o</b>');
  });

  it('bolds a whole mixed selection', () => {
    const root = editableWith('Hello <b>bold</b>');
    selectOffsets(root, 0, 10);
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('<b>Hello bold</b>');
  });

  it('types without bold in the middle of bold text', () => {
    const root = editableWith('<b>hello</b>');
    selectOffsets(root, 2, 2);
    expect(insertTextWithMarks(root, document, 'X', { bold: false, italic: false, underline: false })).toBe(true);
    expect(root.innerHTML).toBe('<b>he</b>X<b>llo</b>');
    expect(selectionFullyHasMark(root, document, 'bold')).toBe(false);
  });

  it('types bold into plain text', () => {
    const root = editableWith('hello');
    selectOffsets(root, 5, 5);
    expect(insertTextWithMarks(root, document, '!', { bold: true, italic: false, underline: false })).toBe(true);
    expect(root.innerHTML).toBe('hello<b>!</b>');
    expect(selectionFullyHasMark(root, document, 'bold')).toBe(true);
  });

  it('removes bold without removing italic', () => {
    const root = editableWith('<b><i>hi</i></b>');
    selectOffsets(root, 0, 2);
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('<i>hi</i>');
  });
});
