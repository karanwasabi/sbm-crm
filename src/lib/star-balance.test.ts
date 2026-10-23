import { describe, expect, it } from 'vitest';
import { parseAccessExpiring } from '@/lib/access-expiry';
import { memberMatchesStarFilter, parseStarBalanceFilter } from '@/lib/star-balance';

describe('star balance filter', () => {
  it('keeps can redeem and never redeemed as separate modes', () => {
    expect(parseStarBalanceFilter('available')).toBe('available');
    expect(parseStarBalanceFilter('unredeemed')).toBe('unredeemed');
    expect(parseStarBalanceFilter('')).toBe('');

    expect(memberMatchesStarFilter('available', 10, 4)).toBe(true);
    expect(memberMatchesStarFilter('unredeemed', 10, 4)).toBe(false);
    expect(memberMatchesStarFilter('unredeemed', 10, 0)).toBe(true);
    expect(memberMatchesStarFilter('available', 0, 0)).toBe(false);
    expect(memberMatchesStarFilter('', 0, 0)).toBe(true);
  });
});

describe('access expiring filter', () => {
  it('keeps known windows and drops unknown values', () => {
    expect(parseAccessExpiring('7d, later, nope, 7d')).toEqual(['7d', 'later']);
    expect(parseAccessExpiring('')).toEqual([]);
  });
});
