import { describe, expect, it } from 'vitest';
import { mapLeadListRow, type LeadListApiRow } from '@/lib/map-lead-list-row';

const base: LeadListApiRow = {
  id: 'lead-1',
  first_name: 'Abisha',
  last_name: 'Rezia',
  email: 'abisha@example.com',
  location: 'India',
  stage: 'member',
  enriched: true,
  dedup: false,
  added_at: '2026-06-26T09:00:00Z',
};

describe('mapLeadListRow', () => {
  it('keeps the columns the Excel export reads from a list row', () => {
    const lead = mapLeadListRow({
      ...base,
      converted_at: '2026-06-26T09:00:51Z',
      stars_earned: 12,
      stars_available: 4,
      stars_value: '₹8',
      membership_ends_at: '2026-11-20T00:00:00Z',
      referrer_coach_name: 'Coach A',
    });

    expect(lead.convertedAt).toBe('2026-06-26T09:00:51Z');
    expect(lead.starsEarned).toBe(12);
    expect(lead.starsAvailable).toBe(4);
    expect(lead.starsValue).toBe('₹8');
    expect(lead.membershipEndsAt).toBe('2026-11-20T00:00:00Z');
    expect(lead.referrerCoachName).toBe('Coach A');
  });

  it('keeps a zero star balance instead of treating it as missing', () => {
    const lead = mapLeadListRow({ ...base, stars_earned: 0, stars_available: 0, stars_spent: 0 });
    expect(lead.starsEarned).toBe(0);
    expect(lead.starsAvailable).toBe(0);
    expect(lead.starsSpent).toBe(0);
  });
});
