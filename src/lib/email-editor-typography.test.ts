import { describe, expect, it } from 'vitest';
import { clearEmailRichFormatting, sanitizeEmailRichHtml } from './email-editor-typography';

describe('sanitizeEmailRichHtml', () => {
  it('keeps bold italic underline and links', () => {
    const input = '<b>Bold</b> <i>Italic</i> <u>Under</u> <a href="https://example.com">Link</a>';
    const out = sanitizeEmailRichHtml(input);
    expect(out).toContain('<b>Bold</b>');
    expect(out).toContain('<i>Italic</i>');
    expect(out).toContain('<u>Under</u>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
  });

  it('strips word-like spans and inline styles', () => {
    const input = '<span style="font-size: 28px; font-family: Comic Sans; font-weight: bold">Pasted</span>';
    const out = sanitizeEmailRichHtml(input);
    expect(out.toLowerCase()).not.toContain('comic');
    expect(out.toLowerCase()).not.toContain('font-size');
    expect(out).toMatch(/pasted/i);
  });

  it('preserves merge tokens as text', () => {
    const out = sanitizeEmailRichHtml('Hello {{lead.first_name}},');
    expect(out).toContain('{{lead.first_name}}');
  });

  it('normalizes strong/em to b/i', () => {
    const out = sanitizeEmailRichHtml('<strong>A</strong> <em>B</em>');
    expect(out).toContain('<b>A</b>');
    expect(out).toContain('<i>B</i>');
    expect(out).not.toContain('<strong>');
    expect(out).not.toContain('<em>');
  });

  it('unwraps nested font wrappers and keeps inner bold', () => {
    const out = sanitizeEmailRichHtml('<font face="Arial"><b>Hi</b></font>');
    expect(out).toContain('<b>Hi</b>');
    expect(out.toLowerCase()).not.toContain('<font');
  });
});

describe('clearEmailRichFormatting', () => {
  it('removes bold italic underline wrappers', () => {
    const out = clearEmailRichFormatting('<b>Hello</b> <i>there</i> <u>friend</u>');
    expect(out).toBe('Hello there friend');
  });
});
