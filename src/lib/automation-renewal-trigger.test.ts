import { describe, expect, it } from 'vitest';
import {
  buildRenewalTriggerConfig,
  normalizeRenewalTriggerConfig,
  parseRenewalTriggerCategories,
  renewalCategoriesFilterLabel,
} from '@/lib/automation-types';

describe('renewal trigger categories', () => {
  it('parses legacy single category', () => {
    expect(parseRenewalTriggerCategories({ renewal_category: 'trial_extend' })).toEqual(['trial_extend']);
  });

  it('parses multi-category array', () => {
    expect(parseRenewalTriggerCategories({ renewal_categories: ['returnee_no_sub', 'trial_extend'] })).toEqual([
      'returnee_no_sub',
      'trial_extend',
    ]);
  });

  it('merges legacy and array without duplicates', () => {
    expect(
      parseRenewalTriggerCategories({
        renewal_category: 'new_user',
        renewal_categories: ['trial_extend', 'new_user'],
      })
    ).toEqual(['trial_extend', 'new_user']);
  });

  it('filters invalid slugs', () => {
    expect(parseRenewalTriggerCategories({ renewal_categories: ['bogus', 'trial_extend'] })).toEqual(['trial_extend']);
  });

  it('empty config means any category', () => {
    expect(parseRenewalTriggerCategories({})).toEqual([]);
    expect(parseRenewalTriggerCategories({ renewal_categories: [] })).toEqual([]);
  });

  it('builds API payload for multi-select', () => {
    expect(buildRenewalTriggerConfig(['trial_extend', 'returnee_no_sub'])).toEqual({
      renewal_categories: ['trial_extend', 'returnee_no_sub'],
    });
  });

  it('builds empty payload when none selected', () => {
    expect(buildRenewalTriggerConfig([])).toEqual({});
  });

  it('normalizes saved config for UI state', () => {
    expect(normalizeRenewalTriggerConfig({ renewal_category: 'member_manual_renew' })).toEqual({
      renewal_categories: ['member_manual_renew'],
    });
  });

  it('labels filter summary', () => {
    expect(renewalCategoriesFilterLabel([])).toBe('Any renew category');
    expect(renewalCategoriesFilterLabel(['trial_extend'])).toBe('Trial extension');
    expect(renewalCategoriesFilterLabel(['trial_extend', 'returnee_no_sub'])).toBe('2 renew categories');
  });
});
