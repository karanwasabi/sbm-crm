import { daysUntilInclusiveAccessEnd } from '@/lib/access-until-display';
import { RENEWAL_EXPIRY_FILTERS } from '@/lib/renewal-display';

const ACCESS_EXPIRY_IDS = new Set(RENEWAL_EXPIRY_FILTERS.map((option) => option.id));

export function parseAccessExpiring(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of raw.split(',')) {
    const value = part.trim().toLowerCase();
    if (!ACCESS_EXPIRY_IDS.has(value) || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }
  return values;
}

export function accessExpiryLabel(id: string): string {
  return RENEWAL_EXPIRY_FILTERS.find((option) => option.id === id)?.label ?? id;
}

/** Same windows as the renewals expiry filter. Grace is a separate state, not a day count. */
export function matchesAccessExpiry(input: { windows: string[]; endsAt?: string | null; inGrace?: boolean }): boolean {
  if (input.windows.length === 0) return true;
  const days = daysUntilInclusiveAccessEnd(input.endsAt);
  return input.windows.some((window) => {
    if (window === 'grace') return Boolean(input.inGrace);
    if (days == null) return false;
    if (window === 'expired') return days < 0;
    if (window === 'later') return days > 60;
    if (window === '7d') return days >= 0 && days <= 7;
    if (window === '14d') return days >= 0 && days <= 14;
    if (window === '30d') return days >= 0 && days <= 30;
    if (window === '60d') return days >= 0 && days <= 60;
    return false;
  });
}
