import { describe, expect, it } from 'vitest';
import { classifyChromeTarget } from './email-canvas-layer';
import { EMAIL_BODY_TEXT_MJML_ATTRS, EMAIL_BODY_TYPOGRAPHY as TYPO } from './email-typography-tokens';
import { grapesMjmlBlockOptions } from './email-editor-blocks';
import { getStarterMjml, getNewsletterMjml } from './email-mjml-starters';

describe('classifyChromeTarget', () => {
  function fakeEl(matches: string[]): Element {
    return {
      closest(selector: string) {
        const parts = selector.split(',').map((s) => s.trim());
        for (const part of parts) {
          // Match class (.foo) or attribute ([data-slot="popover-content"])
          const classMatch = part.match(/^\.([a-z0-9_-]+)/i);
          if (classMatch && matches.includes(classMatch[1]!)) return this as unknown as Element;
          if (part.includes('data-slot') && matches.includes('popover-content')) {
            return this as unknown as Element;
          }
        }
        return null;
      },
    } as unknown as Element;
  }

  it('preserves RTE toolbar (must never flush)', () => {
    expect(classifyChromeTarget(fakeEl(['gjs-rte-toolbar']))).toBe('rte-toolbar');
    expect(classifyChromeTarget(fakeEl(['gjs-rte-action']))).toBe('rte-toolbar');
  });

  it('treats SBM chrome and variable popover as sbm-chrome', () => {
    expect(classifyChromeTarget(fakeEl(['sbm-grapes-toolbar']))).toBe('sbm-chrome');
    expect(classifyChromeTarget(fakeEl(['popover-content']))).toBe('sbm-chrome');
  });

  it('treats structure toolbar separately', () => {
    expect(classifyChromeTarget(fakeEl(['gjs-toolbar']))).toBe('structure-toolbar');
  });

  it('classifies outside shell clicks', () => {
    expect(classifyChromeTarget(fakeEl([]))).toBe('outside');
  });
});

describe('typography contract', () => {
  it('exports matching body tokens', () => {
    expect(TYPO.fontFamily).toContain('Helvetica');
    expect(TYPO.fontSize).toBe('16px');
    expect(EMAIL_BODY_TEXT_MJML_ATTRS).toContain(TYPO.fontFamily);
  });

  it('emits font-family on curated blocks', () => {
    const text = grapesMjmlBlockOptions('mj-text').content as string;
    const twoCol = grapesMjmlBlockOptions('mj-2-columns').content as string;
    expect(text).toContain('font-family=');
    expect(twoCol).toContain('font-family=');
    expect(twoCol).toContain('Content 1');
  });

  it('starters include mj-attributes font-family baseline', () => {
    expect(getStarterMjml('marketing')).toContain('mj-attributes');
    expect(getStarterMjml('marketing')).toContain(TYPO.fontFamily);
    expect(getNewsletterMjml()).toContain(TYPO.fontFamily);
  });
});
