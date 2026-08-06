import { describe, expect, it } from 'vitest';

import type { ProgramHistoryItem } from '@/types/crm';

import { autoRenewInfo } from './program-history-auto-renew';

function item(overrides: Partial<ProgramHistoryItem> = {}): ProgramHistoryItem {
  return {
    id: 'enr-1',
    program: 'Take Control',
    batch: 'Aug 2026',
    status: 'Upcoming',
    amount: '₹4,718.82',
    date: '6 August 2026',
    ...overrides,
  };
}

describe('autoRenewInfo', () => {
  it('returns null for prepaid one-time renewal without a subscription mandate', () => {
    expect(
      autoRenewInfo(
        item({
          accessUntil: '2026-11-17T00:00:00Z',
          cancelAtPeriodEnd: false,
          autoRenewEnabled: false,
        })
      )
    ).toBeNull();
  });

  it('shows On when auto renew is enabled', () => {
    expect(
      autoRenewInfo(
        item({
          status: 'Active',
          autoRenewEnabled: true,
          subscriptionStatus: 'active',
        })
      )
    ).toEqual({ label: 'On', tone: 'success' });
  });

  it('shows Cancelling when cancel at period end is set', () => {
    expect(
      autoRenewInfo(
        item({
          status: 'Active',
          autoRenewEnabled: false,
          cancelAtPeriodEnd: true,
        })
      )
    ).toEqual({ label: 'Cancelling', tone: 'warn' });
  });
});
