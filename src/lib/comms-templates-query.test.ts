import { describe, expect, it } from 'vitest';
import {
  clampCommsTemplatePage,
  commsTemplateTotalPages,
  nextCommsTemplateSort,
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

  it('defaults sort to newest created', () => {
    expect(parseCommsTemplateFilters('whatsapp', {}).sort).toBe('created_at_desc');
  });
});

describe('nextCommsTemplateSort', () => {
  it('toggles order on the active column', () => {
    expect(nextCommsTemplateSort('created_at_desc', 'created_at')).toBe('created_at_asc');
  });

  it('defaults name to ascending and dates to descending', () => {
    expect(nextCommsTemplateSort('created_at_desc', 'name')).toBe('name_asc');
    expect(nextCommsTemplateSort('name_asc', 'updated_at')).toBe('updated_at_desc');
  });
});
