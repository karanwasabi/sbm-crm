import { describe, expect, it, vi } from 'vitest';
import {
  applyMjmlTextTypographyToEditable,
  clearEmailRichFormatting,
  preserveMjmlTextTypographyAttrs,
  readMjmlTextTypography,
  sanitizeEmailRichHtml,
} from './email-editor-typography';

function mockMjmlText(attrs: Record<string, string>, style: Record<string, string> = {}) {
  const state = { attrs: { ...attrs }, style: { ...style } };
  return {
    get: (key: string) => (key === 'type' ? 'mj-text' : undefined),
    getAttributes: () => ({ ...state.attrs }),
    getStyle: () => ({ ...state.style }),
    setAttributes: vi.fn((next: Record<string, string>) => {
      state.attrs = { ...next };
    }),
    _state: state,
  };
}

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

describe('mj-text typography preserve', () => {
  it('reads font from attributes without injecting Helvetica defaults', () => {
    const component = mockMjmlText({ 'font-family': 'Georgia, serif', 'font-size': '16px' });
    expect(readMjmlTextTypography(component as never)).toEqual({
      'font-family': 'Georgia, serif',
      'font-size': '16px',
    });
  });

  it('copies style font onto attrs when attrs are empty', () => {
    const component = mockMjmlText({}, { 'font-family': 'Georgia, serif' });
    const typography = preserveMjmlTextTypographyAttrs(component as never);
    expect(typography['font-family']).toBe('Georgia, serif');
    expect(component.setAttributes).toHaveBeenCalled();
    expect(component._state.attrs['font-family']).toBe('Georgia, serif');
  });

  it('applies typography onto the contenteditable host', () => {
    const component = mockMjmlText({ 'font-family': 'Georgia, serif', 'font-size': '18px', color: '#123456' });
    const editable = { style: {} as Record<string, string> };
    applyMjmlTextTypographyToEditable(component as never, editable as unknown as HTMLElement);
    expect(editable.style.fontFamily).toBe('Georgia, serif');
    expect(editable.style.fontSize).toBe('18px');
    expect(editable.style.color).toBe('#123456');
  });
});
