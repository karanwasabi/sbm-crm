import { describe, expect, it } from 'vitest';
import { formatAutomationRunDetails } from '@/lib/automation-types';

describe('formatAutomationRunDetails', () => {
  it('surfaces send errors first', () => {
    expect(
      formatAutomationRunDetails({
        error: 'Convonite rejected template',
        template_id: 'abc',
        skip_reason: 'should not win',
      })
    ).toBe('Convonite rejected template');
  });

  it('still formats skip reasons when no error', () => {
    expect(formatAutomationRunDetails({ skip_reason: 'no consent' })).toBe('Skipped: no consent');
  });
});
