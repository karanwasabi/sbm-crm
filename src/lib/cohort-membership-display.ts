import type { CohortMember } from '@/types/crm';
import { daysUntilInclusiveAccessEnd, formatInclusiveAccessEndDate } from '@/lib/access-until-display';

export function cohortMembershipDurationDisplay(member: CohortMember): string {
  const label = member.membershipDuration?.trim();
  return label && label !== '—' ? label : '—';
}

/** Inclusive membership end / next auto-renew date for cohort tables. */
export function cohortMembershipEndsDisplay(member: CohortMember): string {
  const exclusive =
    member.membershipEndsAt?.trim() || member.accessUntil?.trim() || member.recurringStartAt?.trim() || '';
  if (exclusive) {
    const date = formatInclusiveAccessEndDate(exclusive);
    const days = daysUntilInclusiveAccessEnd(exclusive);
    let label = date;
    if (days != null) {
      if (days < 0) label = `${date} · ended`;
      else if (days === 0) label = `${date} · today`;
      else if (days === 1) label = `${date} · in 1d`;
      else label = `${date} · in ${days}d`;
    }
    if (member.cancelAtPeriodEnd) return `${label} · cancelling`;
    if (member.autoRenewEnabled) return `${label} · auto-renew`;
    return label;
  }
  if (member.autoRenewEnabled) return 'Auto-renew';
  return '—';
}

export function cohortMembershipExtendedDisplay(member: CohortMember): string {
  return member.membershipExtended ? 'Yes' : 'No';
}
