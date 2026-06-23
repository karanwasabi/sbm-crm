import type { CohortSummary } from '@/types/crm';

type PhasePillTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'deep' | 'paid' | 'organic' | 'offline';

export function sortCohorts(cohorts: CohortSummary[]): CohortSummary[] {
  return [...cohorts].sort((a, b) => b.startsOn.localeCompare(a.startsOn));
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

export function phasePillTone(phaseLabel: string): PhasePillTone {
  switch (phaseLabel) {
    case 'Queued':
      return 'deep';
    case 'Upcoming':
      return 'brand';
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
