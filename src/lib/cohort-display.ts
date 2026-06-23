import type { CohortSummary } from '@/types/crm';

type PhasePillTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'deep' | 'paid' | 'organic' | 'offline';

const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  upcoming: 1,
  active: 2,
  inactive: 3,
};

export function sortCohorts(cohorts: CohortSummary[]): CohortSummary[] {
  return [...cohorts].sort((a, b) => {
    const left = STATUS_ORDER[a.status] ?? 99;
    const right = STATUS_ORDER[b.status] ?? 99;
    if (left !== right) return left - right;
    return a.startsOn.localeCompare(b.startsOn);
  });
}

export function formatCohortStartDate(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatCohortStartDateLong(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function phasePillTone(phaseLabel: string): PhasePillTone {
  switch (phaseLabel) {
    case 'Queued':
      return 'neutral';
    case 'Upcoming':
      return 'brand';
    case 'Initial 3-month phase':
      return 'warn';
    case 'Monthly phase':
      return 'deep';
    case 'Inactive':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function cohortCardHref(cohortId: string): string {
  return `/programs/cohorts/${cohortId}`;
}

export function isInactiveCohort(status: string): boolean {
  return status === 'inactive';
}
