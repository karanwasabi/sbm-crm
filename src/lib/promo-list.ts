import type { PromoListItem } from '@/utils/api';

function startMs(item: PromoListItem): number {
  if (!item.starts_at) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(item.starts_at);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function endMs(item: PromoListItem): number {
  if (!item.ends_at) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(item.ends_at);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function compareCodeDesc(a: PromoListItem, b: PromoListItem): number {
  return b.code.localeCompare(a.code);
}

function sortActiveOrUpcoming(items: PromoListItem[]): PromoListItem[] {
  return [...items].sort((a, b) => {
    const startDiff = startMs(a) - startMs(b);
    if (startDiff !== 0) return startDiff;

    const endDiff = endMs(a) - endMs(b);
    if (endDiff !== 0) return endDiff;

    return compareCodeDesc(a, b);
  });
}

function sortInactive(items: PromoListItem[]): PromoListItem[] {
  return [...items].sort((a, b) => {
    const endDiff = endMs(b) - endMs(a);
    if (endDiff !== 0) return endDiff;

    const startDiff = startMs(a) - startMs(b);
    if (startDiff !== 0) return startDiff;

    return compareCodeDesc(a, b);
  });
}

export type PromoListSections = {
  active: PromoListItem[];
  upcoming: PromoListItem[];
  inactive: PromoListItem[];
};

export function partitionPromoListItems(items: PromoListItem[]): PromoListSections {
  const active: PromoListItem[] = [];
  const upcoming: PromoListItem[] = [];
  const inactive: PromoListItem[] = [];

  for (const item of items) {
    if (item.status === 'scheduled') {
      upcoming.push(item);
    } else if (item.status === 'active') {
      active.push(item);
    } else {
      inactive.push(item);
    }
  }

  return {
    active: sortActiveOrUpcoming(active),
    upcoming: sortActiveOrUpcoming(upcoming),
    inactive: sortInactive(inactive),
  };
}
