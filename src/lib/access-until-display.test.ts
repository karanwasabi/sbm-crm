import { describe, expect, it } from 'vitest';

import {
  addMonthsUTC,
  exclusiveBoundaryDateOnly,
  inclusiveAccessEndDateOnly,
  shiftUtcDateOnly,
} from '@/lib/access-until-display';

describe('access-until-display', () => {
  it('round-trips exclusive boundary for API save', () => {
    const exclusive = '2025-08-20T00:00:00Z';
    const inclusive = inclusiveAccessEndDateOnly(exclusive);
    expect(inclusive).toBe('2025-08-19');
    expect(exclusiveBoundaryDateOnly(inclusive)).toBe('2025-08-20');
  });

  it('is idempotent on stored boundary', () => {
    const exclusive = '2025-08-20T00:00:00Z';
    const inclusive = inclusiveAccessEndDateOnly(exclusive);
    expect(exclusiveBoundaryDateOnly(inclusive)).toBe('2025-08-20');
    expect(inclusiveAccessEndDateOnly('2025-08-20')).toBe(inclusive);
  });

  it('handles month-end boundaries', () => {
    expect(inclusiveAccessEndDateOnly('2025-10-31T00:00:00Z')).toBe('2025-10-30');
    expect(exclusiveBoundaryDateOnly('2025-10-30')).toBe('2025-10-31');
  });

  it('3-month preset uses inclusive last day', () => {
    const boundary = addMonthsUTC('2025-07-20', 3);
    expect(boundary).toBe('2025-10-20');
    const inclusivePreset = shiftUtcDateOnly(boundary, -1);
    expect(inclusivePreset).toBe('2025-10-19');
    expect(exclusiveBoundaryDateOnly(inclusivePreset)).toBe('2025-10-20');
  });
});
