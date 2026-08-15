import type { RenewalRetentionBucket, RenewalRow, RenewalSummary } from '@/types/crm';
import { formatInclusiveAccessEndDate, daysUntilInclusiveAccessEnd } from '@/lib/access-until-display';
import { formatInrFromPaise } from '@/lib/money';
import { buildRenewalsHref, DEFAULT_RENEWAL_FILTERS } from '@/lib/renewal-query';
import { renewalDurationFilterLabel } from '@/lib/renewal-duration';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { LifecycleStage } from '@/types/crm';

export type RenewalBucketFilter = 'at_risk' | RenewalRetentionBucket | 'all';

export function renewalBucketHref(bucket: RenewalBucketFilter): string {
  if (bucket === 'all') return '/renewals';
  return buildRenewalsHref(DEFAULT_RENEWAL_FILTERS, { bucket: bucket === 'at_risk' ? 'at_risk' : bucket });
}

export const RENEWAL_BUCKET_FILTERS: { id: RenewalBucketFilter; label: string }[] = [
  { id: 'all', label: 'Members' },
  { id: 'at_risk', label: 'At Risk' },
  { id: 'cancelling', label: 'Cancelling' },
  { id: 'payment_issue', label: 'Payment Issue' },
  { id: 'churned', label: 'Churned' },
  { id: 'healthy', label: 'Healthy' },
];

export const RENEWAL_PRODUCT_FILTERS: { id: string; label: string }[] = [
  { id: 'trial_1m', label: '1m trial' },
  { id: 'trial_3m', label: '3m trial' },
  { id: 'renewal', label: 'Renewal' },
  { id: 'fixed', label: 'Fixed term' },
  { id: 'subscription', label: 'Subscription' },
];

export const RENEWAL_STAGE_FILTERS: { id: string; label: string }[] = [
  { id: 'newbie', label: 'Newbie' },
  { id: 'member', label: 'Member' },
];

export const RENEWAL_MEMBER_KIND_FILTERS: { id: string; label: string }[] = [
  { id: 'renewal', label: 'Renewal' },
  { id: 'returnee', label: 'Returnee' },
];

export const RENEWAL_EXPIRY_FILTERS: { id: string; label: string }[] = [
  { id: '7d', label: 'Next 7 days' },
  { id: '14d', label: 'Next 14 days' },
  { id: '30d', label: 'Next 30 days' },
  { id: '60d', label: 'Next 60 days' },
  { id: 'grace', label: 'In grace' },
  { id: 'expired', label: 'Already expired' },
  { id: 'later', label: 'Later than 60 days' },
];

export const RENEWAL_ACCESS_FILTERS: { id: string; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'grace', label: 'Grace' },
  { id: 'expired', label: 'Expired' },
];

export function renewalSubtitle(summary: RenewalSummary): string {
  const members = summary.activeOrGrace;
  const expiring = summary.expiring7d;
  const memberLabel = members === 1 ? '1 member with access' : `${members} members with access`;
  if (expiring === 0) {
    return `${memberLabel} · none ending in 7 days`;
  }
  const endingLabel = expiring === 1 ? '1 ending in 7 days' : `${expiring} ending in 7 days`;
  return `${memberLabel} · ${endingLabel}`;
}

export function formatRenewalDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAccessExpiryLabel(row: RenewalRow): string {
  const date = row.accessUntilLabel || (row.accessUntil ? formatInclusiveAccessEndDate(row.accessUntil) : '—');
  const days = row.daysUntilAccessEnd ?? (row.accessUntil ? daysUntilInclusiveAccessEnd(row.accessUntil) : null);
  if (!row.accessUntil) return '—';
  if (days == null) return date;
  if (days < 0) return `${date} · ended`;
  if (days === 0) return `${date} · today`;
  if (days === 1) return `${date} · in 1d`;
  return `${date} · in ${days}d`;
}

export function formatChargeLabel(row: RenewalRow): string {
  return formatAccessExpiryLabel(row);
}

export function membershipProductLabel(row: RenewalRow): string {
  switch (row.membershipProduct) {
    case 'trial_1m':
      return '1m trial';
    case 'trial_3m':
      return '3m trial';
    case 'renewal':
      return row.renewalPlanKey ? `Renewal · ${renewalDurationFilterLabel(row.renewalPlanKey)}` : 'Renewal';
    case 'subscription':
      return 'Subscription';
    default:
      return 'Fixed term';
  }
}

export function isLifecycleStage(value: string | null | undefined): value is LifecycleStage {
  return Boolean(value && value in LIFECYCLE_STAGES);
}

export function bucketLabel(bucket: RenewalRetentionBucket): string {
  switch (bucket) {
    case 'healthy':
      return 'Healthy';
    case 'cancelling':
      return 'Cancelling';
    case 'payment_issue':
      return 'Payment Issue';
    case 'churned':
      return 'Churned';
  }
}

export function bucketTone(bucket: RenewalRetentionBucket): 'success' | 'warn' | 'danger' | 'neutral' {
  switch (bucket) {
    case 'healthy':
      return 'success';
    case 'cancelling':
      return 'warn';
    case 'payment_issue':
      return 'danger';
    case 'churned':
      return 'neutral';
  }
}

export function accessStateLabel(state: string): string {
  switch (state) {
    case 'grace':
      return 'Grace';
    case 'expired':
      return 'Expired';
    default:
      return 'Active';
  }
}

export function riskLabel(risk: RenewalRow['risk']): string {
  switch (risk) {
    case 'high':
      return 'High';
    case 'med':
      return 'Medium';
    default:
      return 'Low';
  }
}

export function riskDotClass(risk: RenewalRow['risk']): string {
  switch (risk) {
    case 'high':
      return 'bg-danger';
    case 'med':
      return 'bg-motivation';
    default:
      return 'bg-success';
  }
}

function facetCount(summary: RenewalSummary, facet: keyof RenewalSummary['facets'], value: string): number | undefined {
  return summary.facets[facet].find((option) => option.value === value)?.count;
}

export function filterCount(summary: RenewalSummary, filter: RenewalBucketFilter): number | undefined {
  switch (filter) {
    case 'at_risk':
      return summary.atRiskCount;
    case 'cancelling':
      return summary.cancellingCount;
    case 'payment_issue':
      return summary.paymentIssueCount;
    case 'churned':
      return facetCount(summary, 'buckets', 'churned') ?? summary.churnedThisMonth;
    case 'healthy':
      return facetCount(summary, 'buckets', 'healthy') ?? summary.healthyCount;
    case 'all':
      return summary.activeOrGrace;
    default:
      return undefined;
  }
}

export function formatClv(paise: number): string {
  return formatInrFromPaise(paise);
}
