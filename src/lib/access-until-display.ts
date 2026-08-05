const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function exclusiveBoundaryUtcParts(isoOrDate: string): { y: number; m: number; d: number } | null {
  const trimmed = isoOrDate.trim();
  if (!trimmed) return null;
  if (DATE_ONLY.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return { y, m: m - 1, d };
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
}

function utcDateOnlyString(parts: { y: number; m: number; d: number }): string {
  const yy = parts.y;
  const mm = String(parts.m + 1).padStart(2, '0');
  const dd = String(parts.d).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function shiftUtcDateOnly(yyyyMmDd: string, deltaDays: number): string {
  const parts = exclusiveBoundaryUtcParts(yyyyMmDd);
  if (!parts) return yyyyMmDd;
  const date = new Date(Date.UTC(parts.y, parts.m, parts.d + deltaDays));
  return utcDateOnlyString({
    y: date.getUTCFullYear(),
    m: date.getUTCMonth(),
    d: date.getUTCDate(),
  });
}

export function inclusiveAccessEndDateOnly(exclusiveIsoOrDate?: string | null): string {
  if (!exclusiveIsoOrDate?.trim()) return '';
  const parts = exclusiveBoundaryUtcParts(exclusiveIsoOrDate);
  if (!parts) return '';
  return shiftUtcDateOnly(utcDateOnlyString(parts), -1);
}

export function exclusiveBoundaryDateOnly(inclusiveYYYYMMDD?: string | null): string {
  if (!inclusiveYYYYMMDD?.trim()) return '';
  if (!DATE_ONLY.test(inclusiveYYYYMMDD.trim())) return inclusiveYYYYMMDD.trim();
  return shiftUtcDateOnly(inclusiveYYYYMMDD.trim(), 1);
}

export function formatInclusiveAccessEndDate(iso?: string | null, style: 'crm' | 'short' = 'crm'): string {
  const inclusive = inclusiveAccessEndDateOnly(iso);
  if (!inclusive) return '—';
  const parts = exclusiveBoundaryUtcParts(inclusive);
  if (!parts) return inclusive;
  const date = new Date(Date.UTC(parts.y, parts.m, parts.d));
  if (Number.isNaN(date.getTime())) return inclusive;
  return new Intl.DateTimeFormat(style === 'crm' ? 'en-GB' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function daysUntilInclusiveAccessEnd(exclusiveIso?: string | null): number | null {
  const inclusive = inclusiveAccessEndDateOnly(exclusiveIso);
  if (!inclusive) return null;
  const parts = exclusiveBoundaryUtcParts(inclusive);
  if (!parts) return null;
  const target = new Date(Date.UTC(parts.y, parts.m, parts.d));
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((target.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24));
}

export function addMonthsUTC(startYYYYMMDD: string, months: number): string {
  const [y, m, d] = startYYYYMMDD.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function cohortStartDateOnly(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
