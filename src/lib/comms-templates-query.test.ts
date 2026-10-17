import { describe, expect, it } from 'vitest';
import {
  clampCommsTemplatePage,
  commsTemplateTotalPages,
  parseCommsTemplateFilters,
} from '@/lib/comms-templates-query';

describe('clampCommsTemplatePage', () => {
  it('clamps past the last page when results exist', () => {
    expect(clampCommsTemplatePage(9, 50, 25)).toBe(2);
  });

  it('clamps to page 1 when total is 0', () => {
    expect(clampCommsTemplatePage(4, 0, 25)).toBe(1);
  });

  it('leaves a valid page unchanged', () => {
    expect(clampCommsTemplatePage(2, 50, 25)).toBe(2);
  });
});

describe('commsTemplateTotalPages', () => {
  it('returns at least 1', () => {
    expect(commsTemplateTotalPages(0, 25)).toBe(1);
  });
});

describe('parseCommsTemplateFilters', () => {
  it('parses email filters from search params', () => {
    const filters = parseCommsTemplateFilters('email', {
      q: 'welcome',
      status: 'active',
      classification: 'marketing',
      sort: 'name_asc',
      page: '2',
    });
    expect(filters).toMatchObject({
      channel: 'email',
      q: 'welcome',
      status: 'active',
      classification: 'marketing',
      sort: 'name_asc',
      page: 2,
    });
  });
});
