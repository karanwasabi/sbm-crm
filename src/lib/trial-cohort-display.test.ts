import { describe, expect, it } from 'vitest';
import type { CohortMember } from '@/types/crm';
import { formatTrialDaysLeft, partitionTrialMembers, trialDaysLeft } from '@/lib/trial-cohort-display';

function member(partial: Partial<CohortMember> & Pick<CohortMember, 'enrollmentId'>): CohortMember {
  return {
    userId: 'u',
    memberName: 'Test',
    memberInitials: 'T',
    email: 't@example.com',
    whatsapp: '',
    city: '',
    countryCode: '',
    countryName: '',
    timezoneId: '',
    timezoneLabel: '',
    enrollmentStatus: 'active',
    memberPhase: 'live',
    subscriptionState: 'lapsed',
    enrolledAt: '2026-01-01T00:00:00Z',
    onboardingCompletedAt: null,
    membershipDuration: '—',
    autoRenewEnabled: false,
    cancelAtPeriodEnd: false,
    membershipExtended: false,
    starsEarned: 0,
    starsSpent: 0,
    starsAvailable: 0,
    starsValue: '',
    ...partial,
  };
}

describe('trialDaysLeft', () => {
  it('counts inclusive calendar days through ends_on in Asia/Kolkata', () => {
    // 22:00 UTC on Nov 11 is already Nov 12 in Kolkata.
    const now = new Date('2026-11-11T22:00:00Z');
    expect(trialDaysLeft('2026-11-12', now)).toBe(1);
    expect(trialDaysLeft('2026-11-14', now)).toBe(3);
    expect(trialDaysLeft('2026-11-11', now)).toBe(0);
  });
});

describe('formatTrialDaysLeft', () => {
  it('shows dash for pending and Ended for lapsed', () => {
    expect(formatTrialDaysLeft(member({ enrollmentId: '1', trialState: 'pending' }))).toBe('—');
    expect(formatTrialDaysLeft(member({ enrollmentId: '2', trialState: 'lapsed', trialEndsOn: '2026-01-01' }))).toBe(
      'Ended'
    );
  });

  it('shows remaining days for active trials', () => {
    const now = new Date('2026-11-12T00:00:00Z');
    expect(
      formatTrialDaysLeft(
        member({
          enrollmentId: '3',
          trialState: 'active',
          trialEndsOn: '2026-11-15',
        }),
        now
      )
    ).toBe('4');
  });
});

describe('partitionTrialMembers', () => {
  it('buckets pending/active/ended and skips converted', () => {
    const rows = [
      member({ enrollmentId: 'p', trialState: 'pending' }),
      member({ enrollmentId: 'a', trialState: 'active' }),
      member({ enrollmentId: 'l', trialState: 'lapsed' }),
      member({ enrollmentId: 'c', trialState: 'converted' }),
      member({ enrollmentId: 'x' }),
    ];
    const parts = partitionTrialMembers(rows);
    expect(parts.pending.map((m) => m.enrollmentId)).toEqual(['p']);
    expect(parts.active.map((m) => m.enrollmentId)).toEqual(['a']);
    expect(parts.ended.map((m) => m.enrollmentId)).toEqual(['l']);
  });
});
