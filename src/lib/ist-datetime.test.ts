import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatPaidRangeChip,
  istDateInputsToPaidRange,
  istLocalInputToRFC3339,
  paidRangeToISTDateInputs,
  shiftCalendarDate,
  validateScheduledPushTime,
} from '@/lib/ist-datetime';

describe('ist-datetime paid range helpers', () => {
  it('shifts calendar dates', () => {
    expect(shiftCalendarDate('2026-08-24', 1)).toBe('2026-08-25');
    expect(shiftCalendarDate('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('converts inclusive IST dates to exclusive paid_to midnight', () => {
    expect(istDateInputsToPaidRange('2026-08-17', '2026-08-24')).toEqual({
      paidFrom: '2026-08-17T00:00:00+05:30',
      paidTo: '2026-08-25T00:00:00+05:30',
    });
  });

  it('reads exclusive paid_to midnight as inclusive end date', () => {
    expect(paidRangeToISTDateInputs('2026-08-17T00:00:00+05:30', '2026-08-25T00:00:00+05:30')).toEqual({
      from: '2026-08-17',
      to: '2026-08-24',
    });
  });

  it('formats paid chip labels for humans', () => {
    expect(formatPaidRangeChip('2026-08-17T00:00:00+05:30', '2026-08-25T00:00:00+05:30')).toBe(
      '2026-08-17 → 2026-08-24'
    );
  });
});

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
