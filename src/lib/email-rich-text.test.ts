/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';
import {
  applyEmailMark,
  canonicalizeEditable,
  emailCaretOffset,
  insertEmailLineBreak,
  insertTextWithMarks,
  placeEmailCaretAtOffset,
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

  it.each([
    ['Line one<br>Line two'],
    ['Line one<br><br>Line two'],
    ['<br>Line'],
    ['Line<br>'],
    ['Line<br><br>'],
    ['a<br><br><br>b'],
  ])('keeps canonical breaks unchanged: %s', (html) => {
    expect(sanitizeEmailRichHtml(html)).toBe(html);
    expect(sanitizeEmailRichHtml(sanitizeEmailRichHtml(html))).toBe(html);
  });

  it('turns paragraphs into single breaks and an empty paragraph into a blank line', () => {
    expect(sanitizeEmailRichHtml('<p>Line one</p><p>Line two</p>')).toBe('Line one<br>Line two');
    expect(sanitizeEmailRichHtml('<p>Line one</p><p><br></p><p>Line two</p>')).toBe('Line one<br><br>Line two');
    expect(sanitizeEmailRichHtml('<p>Line one</p><p></p><p>Line two</p>')).toBe('Line one<br><br>Line two');
    expect(sanitizeEmailRichHtml('<div>hello</div><div><br></div>')).toBe('hello<br>');
    expect(sanitizeEmailRichHtml('<p>Hello <b>bold</b></p><p>Next</p>')).toBe('Hello <b>bold</b><br>Next');
  });

  it('splits a mark around a break without dropping the break', () => {
    expect(sanitizeEmailRichHtml('<b>hello<br>there</b>')).toBe('<b>hello</b><br><b>there</b>');
  });

  it('keeps a second-paragraph selection on the bold word', () => {
    const root = editableWith('<p>Line one</p><p>Line <b>two</b></p>');
    selectTextNode(root, 'two');
    expect(canonicalizeEditable(root)).toBe(true);
    expect(root.innerHTML).toBe('Line one<br>Line <b>two</b>');
    expect(document.getSelection()?.toString()).toBe('two');
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

  it('bolds the word after a line break and leaves that word selected', () => {
    const root = editableWith('hello<br>world');
    selectTextNode(root, 'world');
    expect(toggleEmailMark(root, document, 'bold')).toBe(true);
    expect(root.innerHTML).toBe('hello<br><b>world</b>');
    expect(document.getSelection()?.toString()).toBe('world');
  });

  it('bolds across a line break and keeps the break', () => {
    const root = editableWith('hello<br>world');
    const hello = textNode(root, 'hello');
    const world = textNode(root, 'world');
    const range = document.createRange();
    range.setStart(hello, 3);
    range.setEnd(world, 2);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(applyEmailMark(root, document, 'bold', true)).toBe(true);
    expect(root.innerHTML).toBe('hel<b>lo</b><br><b>wo</b>rld');
    expect(document.getSelection()?.toString()).toBe('lowo');
  });

  it('inserts at the caret after a line break', () => {
    const root = editableWith('hello<br>world');
    const br = root.querySelector('br');
    if (!br) throw new Error('missing br');
    const range = document.createRange();
    range.setStartAfter(br);
    range.collapse(true);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(insertTextWithMarks(root, document, 'X', { bold: false, italic: false, underline: false })).toBe(true);
    expect(root.innerHTML).toBe('hello<br>Xworld');

    range.setStartAfter(root.querySelector('br')!);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    expect(insertTextWithMarks(root, document, 'Y', { bold: true, italic: false, underline: false })).toBe(true);
    expect(root.innerHTML).toBe('hello<br><b>Y</b>Xworld');
  });
});

describe('email line breaks', () => {
  it('inserts one break at the end and in the middle, with the caret after it', () => {
    const end = editableWith('hello');
    selectOffsets(end, 5, 5);
    expect(insertEmailLineBreak(end, document)).toBe(true);
    expect(end.innerHTML).toBe('hello<br>');
    expect(caretAfterBreak(end)).toBe(true);

    const middle = editableWith('hello');
    selectOffsets(middle, 2, 2);
    expect(insertEmailLineBreak(middle, document)).toBe(true);
    expect(middle.innerHTML).toBe('he<br>llo');
    expect(caretAfterBreak(middle)).toBe(true);
  });

  it('counts a break as one caret position and can place the caret after it', () => {
    const root = editableWith('hello<br>world');
    const br = root.querySelector('br');
    if (!br?.parentNode) throw new Error('missing br');
    const after = [...br.parentNode.childNodes].indexOf(br) + 1;
    expect(emailCaretOffset(root, br.parentNode, after)).toBe(6);
    expect(placeEmailCaretAtOffset(root, 6)).toBe(true);
    const range = document.getSelection()?.getRangeAt(0);
    if (!range) throw new Error('missing caret');
    expect(emailCaretOffset(root, range.startContainer, range.startOffset)).toBe(6);
    expect(emailCaretOffset(root, root, root.childNodes.length)).toBe(11);
  });
});

function textNode(root: HTMLElement, text: string): Text {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.textContent === text) return node as Text;
    node = walker.nextNode();
  }
  throw new Error(`text node not found: ${text}`);
}

function caretAfterBreak(root: HTMLElement): boolean {
  const br = root.querySelector('br');
  const range = document.getSelection()?.getRangeAt(0);
  if (!br?.parentNode || !range?.collapsed) return false;
  const after = [...br.parentNode.childNodes].indexOf(br) + 1;
  return range.startContainer === br.parentNode && range.startOffset === after;
}
