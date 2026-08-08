import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { istLocalInputToRFC3339, validateScheduledPushTime } from '@/lib/ist-datetime';

describe('ist-datetime scheduled push validation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T10:00:00+05:30'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires a send date', () => {
    expect(validateScheduledPushTime('', '12:00')).toBe('Send date is required.');
  });

  it('rejects times more than 5 minutes in the past', () => {
    expect(validateScheduledPushTime('2026-08-03', '09:54')).toBe(
      'Send time cannot be more than 5 minutes in the past.'
    );
  });

  it('accepts times within the 5 minute grace window', () => {
    expect(validateScheduledPushTime('2026-08-03', '09:56')).toBeNull();
  });

  it('accepts future send times', () => {
    expect(validateScheduledPushTime('2026-08-03', '11:00')).toBeNull();
  });

  it('builds RFC3339 with IST offset', () => {
    expect(istLocalInputToRFC3339('2026-08-03', '11:30')).toBe('2026-08-03T11:30:00+05:30');
  });
});
