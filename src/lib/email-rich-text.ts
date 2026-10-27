import { ensureEmailLinksOpenInNewTab } from '@/lib/email-mjml-starters';

/**
 * Email rich text uses one model: text, line breaks, links, and the marks
 * bold, italic, and underline. Pasted HTML is reduced to that model by
 * resolving each text node's effective styles. The toolbar then adds or
 * removes those marks on the selection. It does not use document.execCommand,
 * which cannot toggle mixed inline styles reliably.
 */

export type EmailInlineMarks = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type EmailMark = 'bold' | 'italic' | 'underline';

const MARK_TAG: Record<EmailMark, 'b' | 'i' | 'u'> = {
  bold: 'b',
  italic: 'i',
  underline: 'u',
};

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'FIGCAPTION',
  'TR',
]);

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

type MarkDecl = {
  specificity: number;
  order: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CssRule = MarkDecl & { selector: string };

type TextRun = {
  kind: 'text';
  text: string;
  marks: EmailInlineMarks;
  href: string | null;
};

type BreakRun = { kind: 'br' };

type Run = TextRun | BreakRun;

const EMPTY_MARKS: EmailInlineMarks = { bold: false, italic: false, underline: false };

export function sanitizeEmailRichHtml(raw: string): string {
  if (!raw.trim()) return '';
  if (typeof DOMParser === 'undefined') return sanitizeEmailRichHtmlFallback(raw);

  const doc = new DOMParser().parseFromString(wrapHtmlDocument(raw), 'text/html');
  const rules = parseStylesheets(doc);
  const runs: Run[] = [];
  const body = doc.body;
  if (!body) return sanitizeEmailRichHtmlFallback(raw);

  walkNodes(body, EMPTY_MARKS, null, rules, runs, { hasContent: false, lastWasBreak: true });
  return collapseExtraBreaks(serializeRuns(runs));
}

export function clearEmailRichFormatting(raw: string): string {
  const sanitized = sanitizeEmailRichHtml(raw);
  return sanitized
    .replace(/<\/?(?:b|strong|i|em|u)\b[^>]*>/gi, '')
    .replace(/<span\b[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');
}

export function marksEqual(a: EmailInlineMarks, b: EmailInlineMarks): boolean {
  return a.bold === b.bold && a.italic === b.italic && a.underline === b.underline;
}

export function marksAtCaret(editable: HTMLElement, doc: Document): EmailInlineMarks {
  const range = currentRange(doc, editable);
  if (!range) return { ...EMPTY_MARKS };
  const node = nodeCarryingCaretStyle(range);
  if (!node) return { ...EMPTY_MARKS };
  return effectiveMarksAt(node, editable);
}

export function selectionFullyHasMark(editable: HTMLElement, doc: Document, mark: EmailMark): boolean {
  const range = currentRange(doc, editable);
  if (!range || range.collapsed) {
    return marksAtCaret(editable, doc)[mark];
  }

  const start = textOffsetIn(editable, range.startContainer, range.startOffset);
  const end = textOffsetIn(editable, range.endContainer, range.endOffset);
  if (start === end) return false;

  const docNode = editable.ownerDocument;
  const walker = docNode.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
  let sawText = false;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (length > 0) {
      const nodeStart = textOffsetIn(editable, node, 0);
      const nodeEnd = nodeStart + length;
      if (nodeStart < end && nodeEnd > start) {
        sawText = true;
        if (!effectiveMarksAt(node, editable)[mark]) return false;
      }
    }
    node = walker.nextNode();
  }
  return sawText;
}

/** Rewrite the current selection so the mark is either on every character or on none. */
export function applyEmailMark(editable: HTMLElement, doc: Document, mark: EmailMark, enable: boolean): boolean {
  canonicalizeEditable(editable);
  const range = currentRange(doc, editable);
  if (!range || range.collapsed) return false;

  const start = textOffsetIn(editable, range.startContainer, range.startOffset);
  const end = textOffsetIn(editable, range.endContainer, range.endOffset);
  if (start === end) return false;

  const slices: { node: Text; from: number; to: number }[] = [];
  const walker = doc.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const length = text.length;
    if (length > 0) {
      const nodeStart = textOffsetIn(editable, text, 0);
      const from = Math.max(start, nodeStart) - nodeStart;
      const to = Math.min(end, nodeStart + length) - nodeStart;
      if (from < to) slices.push({ node: text, from, to });
    }
    node = walker.nextNode();
  }
  if (slices.length === 0) return false;

  for (const slice of slices.reverse()) {
    applyMarkToTextSlice(slice.node, slice.from, slice.to, mark, enable, editable);
  }
  normalizeInline(editable);
  restoreTextSelection(editable, start, end);
  editable.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

export function toggleEmailMark(editable: HTMLElement, doc: Document, mark: EmailMark): boolean {
  canonicalizeEditable(editable);
  const enable = !selectionFullyHasMark(editable, doc, mark);
  return applyEmailMark(editable, doc, mark, enable);
}

/**
 * Insert text at the caret using exactly these marks, splitting any surrounding
 * mark that should not apply to the new characters.
 */
export function insertTextWithMarks(
  editable: HTMLElement,
  doc: Document,
  text: string,
  marks: EmailInlineMarks
): boolean {
  if (!text) return false;
  canonicalizeEditable(editable);
  const range = currentRange(doc, editable);
  if (!range?.collapsed) return false;

  const caret = textOffsetIn(editable, range.startContainer, range.startOffset);
  exitUnwantedMarks(editable, doc, marks);
  const existing = marksAtCaret(editable, doc);
  const live = currentRange(doc, editable);
  if (!live) return false;

  const node = buildMarkedText(doc, text, {
    bold: marks.bold && !existing.bold,
    italic: marks.italic && !existing.italic,
    underline: marks.underline && !existing.underline,
  });
  live.insertNode(node);
  normalizeInline(editable);
  restoreTextSelection(editable, caret + text.length, caret + text.length);
  editable.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function needsCanonicalForm(html: string): boolean {
  return /<(?!\/?(?:b|i|u|a|br)\b)[a-z]/i.test(html) || /\s(?:style|class|id)\s*=/i.test(html);
}

/** Replace editable contents with the canonical mark model when they differ. */
export function canonicalizeEditable(editable: HTMLElement): boolean {
  const current = editable.innerHTML;
  if (!current.trim() || !needsCanonicalForm(current)) return false;
  const clean = sanitizeEmailRichHtml(current);
  if (!clean || clean === current) return false;

  const doc = editable.ownerDocument;
  const selection = doc.getSelection();
  let saved: { start: number; end: number } | null = null;
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0);
    if (editable.contains(range.startContainer) && editable.contains(range.endContainer)) {
      saved = {
        start: visibleCaretOffset(editable, range.startContainer, range.startOffset),
        end: visibleCaretOffset(editable, range.endContainer, range.endOffset),
      };
    }
  }

  editable.innerHTML = clean;
  if (saved) restoreTextSelection(editable, saved.start, saved.end);
  return true;
}

function wrapHtmlDocument(raw: string): string {
  if (/<html[\s>]/i.test(raw) || /<body[\s>]/i.test(raw)) return raw;
  return `<!doctype html><html><body>${raw}</body></html>`;
}

function parseStylesheets(doc: Document): CssRule[] {
  const css = [...doc.querySelectorAll('style')].map((node) => node.textContent ?? '').join('\n');
  return parseCssRules(css);
}

function parseCssRules(css: string): CssRule[] {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const pattern = /([^{}@]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  let order = 1;
  while ((match = pattern.exec(cleaned))) {
    const marks = declarationsFromStyle(match[2]);
    if (!marks) continue;
    for (const part of match[1].split(',')) {
      const selector = part.trim().toLowerCase();
      const specificity = selectorSpecificity(selector);
      if (specificity == null) continue;
      rules.push({ selector, specificity, order: order++, ...marks });
    }
  }
  return rules;
}

function selectorSpecificity(selector: string): number | null {
  if (!selector || /[>+~:[\]]/.test(selector) || selector.includes(' ')) return null;
  let score = 0;
  if (selector.includes('#')) score += 100;
  const classes = selector.match(/\./g);
  if (classes) score += classes.length * 10;
  const tag = selector.replace(/#[a-z0-9_-]+/gi, '').replace(/\.[a-z0-9_-]+/gi, '');
  if (tag && tag !== '*') score += 1;
  return score;
}

function selectorMatches(el: HTMLElement, selector: string): boolean {
  const idMatch = selector.match(/#([a-z0-9_-]+)/i);
  const classMatches = selector.match(/\.([a-z0-9_-]+)/gi) ?? [];
  const tag = selector
    .replace(/#[a-z0-9_-]+/gi, '')
    .replace(/\.[a-z0-9_-]+/gi, '')
    .trim();
  if (idMatch && el.id.toLowerCase() !== idMatch[1].toLowerCase()) return false;
  if (tag && tag !== '*' && el.tagName.toLowerCase() !== tag) return false;
  const classes = new Set([...el.classList].map((name) => name.toLowerCase()));
  for (const token of classMatches) {
    if (!classes.has(token.slice(1).toLowerCase())) return false;
  }
  return true;
}

function declarationsFromStyle(style: string): Pick<MarkDecl, 'bold' | 'italic' | 'underline'> | null {
  const marks: Pick<MarkDecl, 'bold' | 'italic' | 'underline'> = {};
  let saw = false;
  for (const part of style.split(';')) {
    const colon = part.indexOf(':');
    if (colon <= 0) continue;
    const key = part.slice(0, colon).trim().toLowerCase();
    const value = part
      .slice(colon + 1)
      .replace(/\s*!important\s*$/i, '')
      .trim()
      .toLowerCase();
    if (!value) continue;
    if (key === 'font-weight') {
      const weight = parseFontWeight(value);
      if (weight != null) {
        marks.bold = weight >= 600;
        saw = true;
      }
    } else if (key === 'font-style') {
      if (value === 'italic' || value === 'oblique') {
        marks.italic = true;
        saw = true;
      } else if (value === 'normal') {
        marks.italic = false;
        saw = true;
      }
    } else if (key === 'text-decoration' || key === 'text-decoration-line') {
      marks.underline = value.split(/\s+/).includes('underline');
      saw = true;
    } else if (key === 'font') {
      const shorthand = parseFontShorthand(value);
      if (shorthand.bold != null) marks.bold = shorthand.bold;
      if (shorthand.italic != null) marks.italic = shorthand.italic;
      if (shorthand.bold != null || shorthand.italic != null) saw = true;
    }
  }
  return saw ? marks : null;
}

function parseFontWeight(value: string): number | null {
  if (value === 'bold' || value === 'bolder') return 700;
  if (value === 'normal' || value === 'lighter') return 400;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseFontShorthand(value: string): { bold?: boolean; italic?: boolean } {
  const out: { bold?: boolean; italic?: boolean } = {};
  if (/\bitalic\b|\boblique\b/.test(value)) out.italic = true;
  if (/\bbold\b/.test(value)) out.bold = true;
  const numeric = value.match(/\b([1-9]00)\b/);
  if (numeric) out.bold = Number(numeric[1]) >= 600;
  return out;
}

function walkNodes(
  node: Node,
  marks: EmailInlineMarks,
  href: string | null,
  rules: CssRule[],
  runs: Run[],
  state: { hasContent: boolean; lastWasBreak: boolean }
) {
  if (node.nodeType === Node.TEXT_NODE) {
    appendText(node as Text, marks, href, runs, state);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  const tag = el.tagName;
  if (DROP_WITH_CONTENT.has(tag) || tag.includes(':')) return;
  if (tag === 'BR') {
    pushBreak(runs, state);
    return;
  }

  const nextMarks = applyElementMarks(el, marks, rules);
  const nextHref = tag === 'A' ? (safeHref(el.getAttribute('href') || '') ?? href) : href;
  const block = BLOCK_TAGS.has(tag);
  if (block && state.hasContent && !state.lastWasBreak) pushBreak(runs, state);

  for (const child of [...el.childNodes]) {
    walkNodes(child, nextMarks, nextHref, rules, runs, state);
  }
}

function applyElementMarks(el: HTMLElement, parent: EmailInlineMarks, rules: CssRule[]): EmailInlineMarks {
  const decls: MarkDecl[] = [];
  const tag = el.tagName;
  if (tag === 'B' || tag === 'STRONG') decls.push({ specificity: 1, order: 0, bold: true });
  if (tag === 'I' || tag === 'EM') decls.push({ specificity: 1, order: 0, italic: true });
  if (tag === 'U') decls.push({ specificity: 1, order: 0, underline: true });

  for (const rule of rules) {
    if (!selectorMatches(el, rule.selector)) continue;
    decls.push(rule);
  }

  const inline = declarationsFromStyle(el.getAttribute('style') || '');
  if (inline) decls.push({ specificity: 1000, order: 1_000_000, ...inline });

  decls.sort((a, b) => a.specificity - b.specificity || a.order - b.order);
  const marks: EmailInlineMarks = { ...parent };
  for (const decl of decls) {
    if (decl.bold != null) marks.bold = decl.bold;
    if (decl.italic != null) marks.italic = decl.italic;
    if (decl.underline != null) marks.underline = decl.underline;
  }
  if (parent.underline) marks.underline = true;
  return marks;
}

function whiteSpaceOf(node: Node): string {
  let current = node.parentElement;
  while (current) {
    const style = current.getAttribute('style') || '';
    const match = style.match(/white-space\s*:\s*([^;]+)/i);
    if (match) return match[1].trim().toLowerCase();
    current = current.parentElement;
  }
  return 'normal';
}

function appendText(
  node: Text,
  marks: EmailInlineMarks,
  href: string | null,
  runs: Run[],
  state: { hasContent: boolean; lastWasBreak: boolean }
) {
  const preserveBreaks = preservesNewlines(node);
  const cleaned = (node.textContent ?? '').replace(/\u200b|\ufeff/g, '');
  if (!preserveBreaks) {
    const mapped = mapVisibleText(node.textContent ?? '', false);
    if (!mapped.text) return;
    pushText(mapped.text, marks, href, runs, state);
    return;
  }
  const parts = cleaned.split(/\r\n|\r|\n/);
  parts.forEach((part, index) => {
    if (index > 0) pushBreak(runs, state);
    if (!part) return;
    pushText(part, marks, href, runs, state);
  });
}

function pushText(
  part: string,
  marks: EmailInlineMarks,
  href: string | null,
  runs: Run[],
  state: { hasContent: boolean; lastWasBreak: boolean }
) {
  const previous = runs[runs.length - 1];
  if (previous?.kind === 'text' && marksEqual(previous.marks, marks) && previous.href === href) {
    previous.text += part;
  } else {
    runs.push({ kind: 'text', text: part, marks: { ...marks }, href });
  }
  state.hasContent = true;
  state.lastWasBreak = false;
}

function preservesNewlines(node: Node): boolean {
  const mode = whiteSpaceOf(node);
  return mode === 'pre' || mode === 'pre-wrap' || mode === 'break-spaces';
}

/**
 * Map a raw text node onto the characters that survive sanitizing.
 * `map[i]` is the kept-text offset at raw index `i`.
 */
function mapVisibleText(raw: string, preserveBreaks: boolean): { text: string; map: number[] } {
  const map = new Array<number>(raw.length + 1).fill(0);
  if (!preserveBreaks && !raw.replace(/[\u200b\ufeff]/g, '').trim() && /[\r\n]/.test(raw)) {
    return { text: '', map };
  }

  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\u200b' || ch === '\ufeff') {
      map[i] = out.length;
      i += 1;
      continue;
    }
    if (!preserveBreaks && /\s/.test(ch)) {
      const at = out.length;
      while (i < raw.length && /\s/.test(raw[i]) && raw[i] !== '\u200b' && raw[i] !== '\ufeff') {
        map[i] = at;
        i += 1;
      }
      out += ' ';
      continue;
    }
    if (preserveBreaks && (ch === '\n' || ch === '\r')) {
      map[i] = out.length;
      if (ch === '\r' && raw[i + 1] === '\n') {
        map[i + 1] = out.length;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    map[i] = out.length;
    out += ch;
    i += 1;
  }
  map[raw.length] = out.length;
  return { text: out, map };
}

function visibleCaretOffset(root: HTMLElement, container: Node, offset: number): number {
  let total = 0;
  const visit = (node: Node): boolean => {
    if (node === container) {
      if (node.nodeType === Node.TEXT_NODE) {
        const mapped = mapVisibleText(node.textContent ?? '', preservesNewlines(node));
        const index = Math.max(0, Math.min(offset, mapped.map.length - 1));
        total += mapped.map[index] ?? 0;
      } else {
        const children = [...node.childNodes];
        for (let i = 0; i < offset && i < children.length; i += 1) total += visibleTextLength(children[i]);
      }
      return true;
    }
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).contains(container)) {
      for (const child of [...node.childNodes]) {
        if (child.contains(container)) return visit(child);
        total += visibleTextLength(child);
      }
    }
    return false;
  };
  visit(root);
  return total;
}

function visibleTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return mapVisibleText(node.textContent ?? '', preservesNewlines(node)).text.length;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return 0;
  const el = node as HTMLElement;
  const tag = el.tagName;
  if (DROP_WITH_CONTENT.has(tag) || tag.includes(':') || tag === 'BR') return 0;
  let count = 0;
  for (const child of [...el.childNodes]) count += visibleTextLength(child);
  return count;
}

function pushBreak(runs: Run[], state: { hasContent: boolean; lastWasBreak: boolean }) {
  if (!state.hasContent || state.lastWasBreak) return;
  runs.push({ kind: 'br' });
  state.lastWasBreak = true;
}

function serializeRuns(runs: Run[]): string {
  return runs
    .map((run) => {
      if (run.kind === 'br') return '<br>';
      let html = escapeHtml(run.text);
      if (run.marks.underline) html = `<u>${html}</u>`;
      if (run.marks.italic) html = `<i>${html}</i>`;
      if (run.marks.bold) html = `<b>${html}</b>`;
      if (run.href) {
        html = `<a href="${escapeAttribute(run.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      return html;
    })
    .join('');
}

function collapseExtraBreaks(html: string): string {
  return html.replace(/(?:<br>\s*){3,}/g, '<br><br>');
}

function safeHref(href: string): string | null {
  const value = href.trim();
  if (!value) return null;
  if (/^(javascript|data):/i.test(value)) return null;
  return value;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&nbsp;');
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

function effectiveMarksAt(node: Node, editable: HTMLElement): EmailInlineMarks {
  const chain: HTMLElement[] = [];
  let current: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
  while (current && current !== editable) {
    if (current.nodeType === Node.ELEMENT_NODE) chain.push(current as HTMLElement);
    current = current.parentNode;
  }
  chain.reverse();
  let marks = { ...EMPTY_MARKS };
  for (const el of chain) marks = applyElementMarks(el, marks, []);
  return marks;
}

function nodeCarryingCaretStyle(range: Range): Node | null {
  if (range.startContainer.nodeType === Node.TEXT_NODE) return range.startContainer;
  return range.startContainer;
}

function currentRange(doc: Document, editable: HTMLElement): Range | null {
  const selection = doc.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) return null;
  return range;
}

function applyMarkToTextSlice(
  textNode: Text,
  from: number,
  to: number,
  mark: EmailMark,
  enable: boolean,
  editable: HTMLElement
) {
  let middle = textNode;
  if (to < middle.length) middle.splitText(to);
  if (from > 0) middle = middle.splitText(from);
  isolateAsOnlyChild(middle, editable);

  const marked = ancestorMark(middle, mark, editable);
  if (enable && !marked) {
    const doc = middle.ownerDocument;
    if (!doc || !middle.parentNode) return;
    const wrapper = doc.createElement(MARK_TAG[mark]);
    middle.parentNode.insertBefore(wrapper, middle);
    wrapper.appendChild(middle);
    return;
  }
  if (!enable && marked) {
    let parent = middle.parentElement;
    while (parent && parent !== editable) {
      const next = parent.parentElement;
      if (markForTag(parent.tagName) === mark) unwrapElement(parent);
      parent = next;
    }
  }
}

function isolateAsOnlyChild(node: Node, stop: HTMLElement) {
  let current: Node | null = node;
  while (current?.parentElement && current.parentElement !== stop) {
    splitAroundChild(current.parentElement, current);
    current = current.parentElement;
  }
}

function splitAroundChild(parent: HTMLElement, child: Node) {
  const grand = parent.parentNode;
  if (!grand) return;
  const left = parent.cloneNode(false) as HTMLElement;
  while (parent.firstChild && parent.firstChild !== child) left.appendChild(parent.firstChild);
  if (left.childNodes.length) grand.insertBefore(left, parent);

  const right = parent.cloneNode(false) as HTMLElement;
  while (child.nextSibling) right.appendChild(child.nextSibling);
  if (right.childNodes.length) grand.insertBefore(right, parent.nextSibling);
}

function ancestorMark(node: Node, mark: EmailMark, stop: HTMLElement): boolean {
  let current = node.parentElement;
  while (current && current !== stop) {
    if (markForTag(current.tagName) === mark) return true;
    current = current.parentElement;
  }
  return false;
}

function unwrapElement(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function normalizeInline(root: HTMLElement) {
  for (const el of [...root.querySelectorAll('strong')]) renameElement(el, 'b');
  for (const el of [...root.querySelectorAll('em')]) renameElement(el, 'i');
  for (const el of [...root.querySelectorAll('span')]) unwrapElement(el);
  let removed = true;
  while (removed) {
    removed = false;
    for (const el of [...root.querySelectorAll('b, i, u, a')]) {
      if (el.querySelector('br')) continue;
      if (el.textContent?.length) continue;
      el.remove();
      removed = true;
    }
  }
  mergeAdjacentMarks(root);
  root.normalize();
}

function renameElement(el: Element, tagName: string) {
  const doc = el.ownerDocument;
  if (!doc) return;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.parentNode?.replaceChild(next, el);
}

function mergeAdjacentMarks(parent: Node) {
  for (const child of [...parent.childNodes]) mergeAdjacentMarks(child);
  let child = parent.firstChild;
  while (child?.nextSibling) {
    const next = child.nextSibling;
    if (canMergeMarks(child, next)) {
      while (next.firstChild) child.appendChild(next.firstChild);
      next.remove();
      continue;
    }
    child = next;
  }
}

function canMergeMarks(a: Node, b: Node): a is HTMLElement {
  if (a.nodeType !== Node.ELEMENT_NODE || b.nodeType !== Node.ELEMENT_NODE) return false;
  const left = a as HTMLElement;
  const right = b as HTMLElement;
  if (left.tagName !== right.tagName) return false;
  if (!['B', 'I', 'U', 'A'].includes(left.tagName)) return false;
  if (left.tagName === 'A' && left.getAttribute('href') !== right.getAttribute('href')) return false;
  return true;
}

function exitUnwantedMarks(editable: HTMLElement, doc: Document, desired: EmailInlineMarks) {
  for (let guard = 0; guard < 20; guard += 1) {
    const range = currentRange(doc, editable);
    if (!range?.collapsed) return;
    const unwanted = closestUnwantedMark(range.startContainer, editable, desired);
    if (!unwanted) return;
    splitMarkElement(unwanted, range);
  }
}

function closestUnwantedMark(node: Node, editable: HTMLElement, desired: EmailInlineMarks): HTMLElement | null {
  let current: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
  while (current && current !== editable) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      const mark = markForTag(el.tagName);
      if (mark && !desired[mark]) return el;
    }
    current = current.parentNode;
  }
  return null;
}

function markForTag(tag: string): EmailMark | null {
  if (tag === 'B' || tag === 'STRONG') return 'bold';
  if (tag === 'I' || tag === 'EM') return 'italic';
  if (tag === 'U') return 'underline';
  return null;
}

function splitMarkElement(el: HTMLElement, range: Range) {
  const doc = el.ownerDocument;
  const parent = el.parentNode;
  if (!doc || !parent) return;

  const after = doc.createRange();
  after.setStart(range.startContainer, range.startOffset);
  after.setEnd(el, el.childNodes.length);
  const tail = after.extractContents();
  const clone = el.cloneNode(false) as HTMLElement;
  clone.appendChild(tail);
  parent.insertBefore(clone, el.nextSibling);
  if (!elementHasVisibleContent(el)) el.remove();
  if (!elementHasVisibleContent(clone)) clone.remove();

  const caret = doc.createRange();
  if (clone.isConnected) caret.setStartBefore(clone);
  else if (el.isConnected) caret.setStartAfter(el);
  else return;
  caret.collapse(true);
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(caret);
}

function elementHasVisibleContent(el: HTMLElement): boolean {
  return Boolean(el.textContent?.length || el.querySelector('br'));
}

function buildMarkedText(doc: Document, text: string, marks: EmailInlineMarks): Node {
  let node: Node = doc.createTextNode(text);
  if (marks.underline) node = wrapNode(doc, 'u', node);
  if (marks.italic) node = wrapNode(doc, 'i', node);
  if (marks.bold) node = wrapNode(doc, 'b', node);
  return node;
}

function wrapNode(doc: Document, tag: string, child: Node): HTMLElement {
  const el = doc.createElement(tag);
  el.appendChild(child);
  return el;
}

function textOffsetIn(root: HTMLElement, container: Node, offset: number): number {
  const doc = root.ownerDocument;
  const range = doc.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);
  return range.toString().length;
}

function restoreTextSelection(root: HTMLElement, start: number, end: number) {
  const doc = root.ownerDocument;
  const startPoint = pointAtTextOffset(root, start);
  const endPoint = pointAtTextOffset(root, end);
  const range = doc.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function pointAtTextOffset(root: HTMLElement, target: number): { node: Node; offset: number } {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (seen + length >= target) return { node, offset: target - seen };
    seen += length;
    node = walker.nextNode();
  }
  return { node: root, offset: root.childNodes.length };
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
