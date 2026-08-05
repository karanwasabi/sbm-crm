import { describe, expect, it, vi } from 'vitest';

import {
  componentHasDualTextExport,
  isMjmlTextComponentVisuallyBlank,
  reconcileMjmlTextComponent,
} from '@/lib/email-mjml-compile';

type MockComponentOptions = {
  type?: string;
  content?: string;
  innerHtml?: string;
  childText?: string;
  childCount?: number;
};

function createMockComponent({
  type = 'mj-text',
  content = '',
  innerHtml = '',
  childText = '',
  childCount = 0,
}: MockComponentOptions) {
  let storedContent = content;
  const resetFromString = vi.fn();

  const component = {
    get: (key: string) => {
      if (key === 'type') return type;
      if (key === 'content') return storedContent;
      return undefined;
    },
    set: (key: string, value: string) => {
      if (key === 'content') storedContent = value;
    },
    is: (name: string) => name === 'text' && type === 'text',
    getInnerHTML: () => innerHtml,
    view: undefined as { render?: () => void } | undefined,
    components: () => ({
      length: childCount,
      models:
        childCount > 0
          ? [
              {
                get: (key: string) => {
                  if (key === 'type') return 'textnode';
                  if (key === 'content') return childText;
                  return undefined;
                },
              },
            ]
          : [],
      resetFromString,
    }),
  };

  return { component: component as never, resetFromString, getContent: () => storedContent };
}

describe('email-mjml-compile', () => {
  it('detects dual text export state', () => {
    const { component } = createMockComponent({ content: 'Hello', childCount: 1 });
    expect(componentHasDualTextExport(component)).toBe(true);
  });

  it('treats empty mj-text blocks as visually blank', () => {
    const { component } = createMockComponent({ content: '', innerHtml: '', childCount: 0 });
    expect(isMjmlTextComponentVisuallyBlank(component)).toBe(true);
  });

  it('reconciles blank text from fallback html after RTE', () => {
    const { component, resetFromString } = createMockComponent({ content: '', childCount: 0 });
    const changed = reconcileMjmlTextComponent(component, {
      fallbackHtml: 'Read <a href="https://example.com">more</a>',
    });

    expect(changed).toBe(true);
    expect(resetFromString).toHaveBeenCalledTimes(1);
    const [html] = resetFromString.mock.calls[0] as [string, { fromDisable: boolean }];
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('reconciles dual-export text blocks', () => {
    const { component, resetFromString } = createMockComponent({
      content: 'Hello',
      innerHtml: 'Hello',
      childCount: 1,
      childText: 'Hello',
    });

    const changed = reconcileMjmlTextComponent(component, { forceHtml: 'Hello' });
    expect(changed).toBe(true);
    expect(resetFromString).toHaveBeenCalledWith('Hello', { fromDisable: true });
  });
});
