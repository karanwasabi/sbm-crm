import type { CohortMember, CohortMemberTrialState } from '@/types/crm';
import { TAKE_CONTROL_TRIAL_PROGRAM_SLUG } from '@/lib/cohort-display';

export function isTrialCohortDetail(cohort: { programSlug?: string }): boolean {
  return cohort.programSlug === TAKE_CONTROL_TRIAL_PROGRAM_SLUG;
}

export function trialStateLabel(state: CohortMemberTrialState | undefined): string {
  switch (state) {
    case 'pending':
      return 'Pending';
    case 'active':
      return 'Active';
    case 'lapsed':
      return 'Ended';
    case 'converted':
      return 'Converted';
    default:
      return '—';
  }
}

/** Inclusive calendar days remaining through ends_on (Asia/Kolkata date). Null when not active/dated. */
export function trialDaysLeft(endsOn: string | null | undefined, now = new Date()): number | null {
  if (!endsOn || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return null;
  const [year, month, day] = endsOn.split('-').map(Number);
  const endUTC = Date.UTC(year, month - 1, day);
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = Number(todayParts.find((p) => p.type === 'year')?.value);
  const m = Number(todayParts.find((p) => p.type === 'month')?.value);
  const d = Number(todayParts.find((p) => p.type === 'day')?.value);
  if (!y || !m || !d) return null;
  const todayUTC = Date.UTC(y, m - 1, d);
  return Math.round((endUTC - todayUTC) / 86_400_000) + 1;
}

export function formatTrialDaysLeft(member: CohortMember, now = new Date()): string {
  if (member.trialState === 'pending') return '—';
  if (member.trialState === 'lapsed' || member.trialState === 'converted') return 'Ended';
  const left = trialDaysLeft(member.trialEndsOn, now);
  if (left == null) return '—';
  if (left <= 0) return 'Ended';
  return String(left);
}

export function formatTrialDate(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function partitionTrialMembers(members: CohortMember[]): {
  pending: CohortMember[];
  active: CohortMember[];
  ended: CohortMember[];
} {
  const pending: CohortMember[] = [];
  const active: CohortMember[] = [];
  const ended: CohortMember[] = [];
  for (const member of members) {
    switch (member.trialState) {
      case 'pending':
        pending.push(member);
        break;
      case 'active':
        active.push(member);
        break;
      case 'lapsed':
        ended.push(member);
        break;
      default:
        // Converted or missing trial row — omit from trial sections.
        break;
    }
  }
  return { pending, active, ended };
}
