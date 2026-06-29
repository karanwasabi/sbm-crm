import { normalizeProfileTimezoneForDb } from '@/lib/profile-timezone';

export const DEFAULT_DISPLAY_TIMEZONE = 'Asia/Kolkata';

export function resolveDisplayTimezone(timezoneId?: string | null): string {
  if (!timezoneId) return DEFAULT_DISPLAY_TIMEZONE;
  return normalizeProfileTimezoneForDb(timezoneId) ?? DEFAULT_DISPLAY_TIMEZONE;
}

type DateTimeFormatStyle = 'lead' | 'activity';

function formatToParts(date: Date, timeZone: string, style: DateTimeFormatStyle) {
  return new Intl.DateTimeFormat(style === 'lead' ? 'en-GB' : 'en-IN', {
    timeZone,
    day: style === 'lead' ? '2-digit' : 'numeric',
    month: style === 'lead' ? '2-digit' : 'short',
    year: style === 'lead' ? '2-digit' : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

export function formatDateTimeInTimezone(
  iso: string | null | undefined,
  timezoneId?: string | null,
  style: DateTimeFormatStyle = 'lead'
): string {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const timeZone = resolveDisplayTimezone(timezoneId);
  const parts = formatToParts(date, timeZone, style);
  const day = partValue(parts, 'day');
  const month = partValue(parts, 'month');
  const year = partValue(parts, 'year');
  const hour = partValue(parts, 'hour');
  const minute = partValue(parts, 'minute');
  const ampm = partValue(parts, 'dayPeriod').toLowerCase();

  if (style === 'lead') {
    return `${day}/${month}/${year} ${hour}:${minute} ${ampm}`;
  }

  return `${day} ${month} ${year}, ${hour}:${minute} ${ampm}`;
}

export function formatLeadTimestamp(iso: string, timezoneId?: string | null): string {
  return formatDateTimeInTimezone(iso, timezoneId, 'lead');
}

export function formatActivityTimestamp(iso: string | null | undefined, timezoneId?: string | null): string {
  return formatDateTimeInTimezone(iso, timezoneId, 'activity');
}
