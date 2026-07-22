/** Matches backend habits.CheckInRolloverHour — evening-relative copy from this hour onward. */
export const CHECK_IN_RELATIVE_EVENING_START_HOUR = 18;

export type CheckInQuestionCopy = {
  programDayName: string;
  sleepNightName: string;
  useRelativeDay: boolean;
};

export type CheckInCopyMode = 'live' | 'namedDay';

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10);
  const d = Number.parseInt(m[3]!, 10);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return { y, m: mo, d };
}

function weekdayFromYmd(ymd: string): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return 'today';
  const date = new Date(parsed.y, parsed.m - 1, parsed.d);
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

function previousDayYmd(ymd: string): string | null {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const date = new Date(parsed.y, parsed.m - 1, parsed.d);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localHourInTimeZone(instant: Date, timeZone: string): number | null {
  const tz = timeZone.trim();
  if (!tz) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(instant);
    const hour = parts.find((p) => p.type === 'hour')?.value;
    if (hour == null) return null;
    return Number.parseInt(hour, 10);
  } catch {
    return null;
  }
}

export function buildCheckInQuestionCopy(args: {
  programDayYmd: string;
  timeZone: string;
  openedAt: Date;
  mode?: CheckInCopyMode;
}): CheckInQuestionCopy {
  const programDayName = weekdayFromYmd(args.programDayYmd);
  const prev = previousDayYmd(args.programDayYmd);
  const sleepNightName = prev ? weekdayFromYmd(prev) : programDayName;

  if (args.mode === 'namedDay') {
    return { programDayName, sleepNightName, useRelativeDay: false };
  }

  const hour = localHourInTimeZone(args.openedAt, args.timeZone);
  const useRelativeDay = hour != null && hour >= CHECK_IN_RELATIVE_EVENING_START_HOUR;

  return { programDayName, sleepNightName, useRelativeDay };
}

export function sleepQuestion(copy: CheckInQuestionCopy): string {
  return copy.useRelativeDay
    ? 'How many hours did you sleep last night?'
    : `How many hours did you sleep on ${copy.sleepNightName} night?`;
}

export function walkingQuestion(copy: CheckInQuestionCopy): string {
  return copy.useRelativeDay
    ? 'How many steps did you walk today?'
    : `How many steps did you walk on ${copy.programDayName}?`;
}

export function exerciseDidQuestion(copy: CheckInQuestionCopy): string {
  return copy.useRelativeDay ? 'Did you exercise today?' : `Did you exercise on ${copy.programDayName}?`;
}

export function nutritionDayPhrase(copy: CheckInQuestionCopy): string {
  return copy.useRelativeDay ? 'today' : `on ${copy.programDayName}`;
}
