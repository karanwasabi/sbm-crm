type PhasePillTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'deep' | 'paid' | 'organic' | 'offline';

export function isLiveCohort(cohort: { isLive?: boolean; status?: string }): boolean {
  return cohort.status === 'upcoming' || cohort.status === 'queued' || Boolean(cohort.isLive);
}

export function compareCohortsLiveFirst(
  a: { startsOn: string; isLive?: boolean; status?: string },
  b: { startsOn: string; isLive?: boolean; status?: string }
): number {
  const liveDiff = Number(isLiveCohort(b)) - Number(isLiveCohort(a));
  if (liveDiff !== 0) return liveDiff;
  return b.startsOn.localeCompare(a.startsOn);
}

export function sortCohorts<T extends { startsOn: string; isLive?: boolean; status?: string }>(cohorts: T[]): T[] {
  return [...cohorts].sort(compareCohortsLiveFirst);
}

export function partitionCohorts<T extends { startsOn: string; isLive?: boolean; status?: string }>(
  cohorts: T[]
): { live: T[]; test: T[] } {
  const sorted = sortCohorts(cohorts);
  return {
    live: sorted.filter((cohort) => isLiveCohort(cohort)),
    test: sorted.filter((cohort) => !isLiveCohort(cohort)),
  };
}

export function firstLiveCohortId<T extends { id: string; isLive?: boolean; status?: string; startsOn: string }>(
  cohorts: T[]
): string {
  const { live, test } = partitionCohorts(cohorts);
  return live[0]?.id ?? test[0]?.id ?? '';
}

export function formatCohortStartDate(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatCohortStartDateCard(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCohortStartDateLong(startsOn: string): string {
  return formatCohortStartDateCard(startsOn);
}

/** Matches backend cohortPointAEffective UTC calendar comparison. */
export function cohortStartDateReached(startsOn: string, now = new Date()): boolean {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return parsed.getTime() <= todayUTC;
}

export function phasePillTone(phaseLabel: string): PhasePillTone {
  switch (phaseLabel) {
    case 'Queued':
      return 'deep';
    case 'Upcoming':
      return 'brand';
    case 'Locked':
      return 'warn';
    case 'Initial 3-month phase':
      return 'warn';
    case 'Monthly phase':
      return 'success';
    case 'Inactive':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function cohortCardSurface(status: string): string {
  switch (status) {
    case 'queued':
      return 'relative overflow-hidden border-[#C4B5FD] bg-linear-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#EDE9FE] hover:border-[#A78BFA] hover:shadow-[0_10px_28px_-14px_rgba(124,58,237,0.45)]';
    case 'upcoming':
      return 'relative overflow-hidden border-brand/40 bg-linear-to-br from-[#F5F7FF] via-[#EEF0FF] to-[#E0E7FF] hover:border-brand/60 hover:shadow-[0_10px_28px_-14px_rgba(92,101,207,0.38)]';
    case 'locked':
      return 'relative overflow-hidden border-amber-300 bg-linear-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] hover:border-amber-400 hover:shadow-[0_10px_28px_-14px_rgba(217,119,6,0.35)]';
    case 'inactive':
      return 'border-slate-100 bg-linear-to-br from-slate-50 to-slate-100/80 opacity-70 hover:opacity-85';
    default:
      return 'border-slate-100 bg-white hover:border-brand/30 hover:shadow-sm';
  }
}

export function cohortCardGlow(status: string): string | null {
  switch (status) {
    case 'queued':
      return 'bg-[#A78BFA]/35';
    case 'upcoming':
      return 'bg-brand/30';
    case 'locked':
      return 'bg-amber-400/35';
    default:
      return null;
  }
}

export function cohortHeaderAccent(status: string): string {
  switch (status) {
    case 'queued':
      return 'border-[#7C3AED] from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]';
    case 'upcoming':
      return 'border-brand-press from-brand via-[#6A71E6] to-brand-press';
    case 'locked':
      return 'border-amber-600 from-amber-500 via-amber-600 to-amber-700';
    case 'inactive':
      return 'border-slate-400 from-slate-500 via-slate-500 to-slate-600';
    default:
      return 'border-brand-press from-brand via-[#6A71E6] to-brand-press';
  }
}

export function cohortCardHref(cohortId: string): string {
  return `/programs/cohorts/${cohortId}`;
}

export function isInactiveCohort(status: string): boolean {
  return status === 'inactive';
}
