const IST_TIMEZONE = 'Asia/Kolkata';

export function formatDateTimeIST(iso: string | null | undefined): string {
  if (!iso) return '—';
  return (
    new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso)) + ' IST'
  );
}

export function istLocalInputToRFC3339(date: string, time: string): string {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim() || '00:00';
  return `${trimmedDate}T${trimmedTime}:00+05:30`;
}

export function splitISTInputDefaults(): { date: string; time: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function isoToISTDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isoToISTTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')}`;
}

/** Shift a YYYY-MM-DD calendar date by N days (UTC arithmetic on the calendar components). */
export function shiftCalendarDate(date: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return '';
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/**
 * Convert paid_from/paid_to URL values (ISO or YYYY-MM-DD) into inclusive IST date inputs.
 * Performance drilldowns use exclusive `paid_to` at midnight IST → show the previous calendar day.
 */
export function paidRangeToISTDateInputs(paidFrom: string, paidTo: string): { from: string; to: string } {
  const from = paidFrom.includes('T') ? isoToISTDateInput(paidFrom) : paidFrom.trim();
  if (!paidTo.trim()) {
    return { from, to: '' };
  }
  if (!paidTo.includes('T')) {
    return { from, to: paidTo.trim() };
  }
  const toDate = isoToISTDateInput(paidTo);
  const toTime = isoToISTTimeInput(paidTo);
  if (toDate && (toTime === '00:00' || toTime === '0:00')) {
    return { from, to: shiftCalendarDate(toDate, -1) };
  }
  return { from, to: toDate };
}

/** Inclusive IST calendar dates → paid_from / exclusive paid_to as RFC3339 (+05:30). */
export function istDateInputsToPaidRange(from: string, to: string): { paidFrom: string; paidTo: string } {
  const paidFrom = from.trim() ? istLocalInputToRFC3339(from.trim(), '00:00') : '';
  const paidTo = to.trim() ? istLocalInputToRFC3339(shiftCalendarDate(to.trim(), 1), '00:00') : '';
  return { paidFrom, paidTo };
}

export function formatPaidRangeChip(paidFrom: string, paidTo: string): string {
  const { from, to } = paidRangeToISTDateInputs(paidFrom, paidTo);
  return [from, to].filter(Boolean).join(' → ');
}

export type ISTDateTimeInput = { date: string; time: string };

/** Allow start/end times that are slightly in the past (clock drift, minute rounding, save delay). */
export const PROMO_SCHEDULE_PAST_GRACE_MS = 5 * 60 * 1000;

function istInputToMs(date: string, time: string): number {
  return new Date(istLocalInputToRFC3339(date, time)).getTime();
}

function earliestAllowedScheduleMs(): number {
  return Date.now() - PROMO_SCHEDULE_PAST_GRACE_MS;
}

export function validatePromoScheduleDates(
  minAt: ISTDateTimeInput,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string | null {
  if (!startDate.trim()) {
    return 'Start date is required.';
  }

  const earliestMs = earliestAllowedScheduleMs();
  const dialogMinMs = istInputToMs(minAt.date, minAt.time) - PROMO_SCHEDULE_PAST_GRACE_MS;
  const startMs = istInputToMs(startDate, startTime);

  if (startMs < dialogMinMs) {
    return 'Start cannot be before this dialog was opened.';
  }
  if (startMs < earliestMs) {
    return 'Start time cannot be more than 5 minutes in the past.';
  }

  if (endDate.trim()) {
    const endMs = istInputToMs(endDate, endTime || '23:59');
    if (endMs < earliestMs) {
      return 'End time cannot be more than 5 minutes in the past.';
    }
    if (endMs <= startMs) {
      return 'End must be after start.';
    }
  }

  return null;
}

export function validateScheduledPushTime(startDate: string, startTime: string): string | null {
  if (!startDate.trim()) {
    return 'Send date is required.';
  }

  const earliestMs = earliestAllowedScheduleMs();
  const startMs = istInputToMs(startDate, startTime);

  if (startMs < earliestMs) {
    return 'Send time cannot be more than 5 minutes in the past.';
  }

  return null;
}
