export const STAR_BALANCE_FILTERS = [
  { id: 'available', label: 'Can redeem' },
  { id: 'unredeemed', label: 'Can redeem, never redeemed' },
] as const;

export type StarBalanceFilter = '' | (typeof STAR_BALANCE_FILTERS)[number]['id'];

export function formatStarRupees(available: number): string {
  return `₹${(available * 2).toLocaleString('en-IN')}`;
}

export function parseStarBalanceFilter(raw: string | undefined | null): StarBalanceFilter {
  const value = raw?.trim().toLowerCase();
  if (value === 'available' || value === 'unredeemed') return value;
  return '';
}

export function starBalanceFilterLabel(filter: StarBalanceFilter): string {
  return STAR_BALANCE_FILTERS.find((option) => option.id === filter)?.label ?? '';
}

export function memberMatchesStarFilter(
  filter: StarBalanceFilter,
  available: number | null | undefined,
  spent: number | null | undefined
): boolean {
  if (!filter) return true;
  if ((available ?? 0) <= 0) return false;
  if (filter === 'available') return true;
  return (spent ?? 0) === 0;
}
