import type { RenewalAction, RenewalRetentionBucket, RenewalRow, RenewalSummary } from '@/types/crm';
import { formatCompactInrFromPaise, formatInrFromPaise } from '@/lib/money';

export type RenewalBucketFilter = 'at_risk' | RenewalRetentionBucket | 'all';

export const RENEWAL_BUCKET_FILTERS: { id: RenewalBucketFilter; label: string }[] = [
  { id: 'at_risk', label: 'At risk' },
  { id: 'cancelling', label: 'Cancelling' },
  { id: 'payment_issue', label: 'Payment issue' },
  { id: 'churned', label: 'Churned' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'all', label: 'All' },
];

export function renewalSubtitle(summary: RenewalSummary): string {
  if (summary.atRiskCount === 0) {
    return 'No members at retention risk';
  }
  const countLabel = summary.atRiskCount === 1 ? '1 member at risk' : `${summary.atRiskCount} members at risk`;
  return `${countLabel} · ${formatCompactInrFromPaise(summary.atRiskMrrPaise)} MRR`;
}

export function formatRenewalDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatChargeLabel(row: RenewalRow): string {
  if (row.retentionBucket === 'cancelling' && row.accessUntil) {
    const date = formatRenewalDate(row.accessUntil);
    const days = daysUntilIso(row.accessUntil);
    if (days != null && days >= 0) {
      return `Access ends ${date} · in ${days}d`;
    }
    return `Access ends ${date}`;
  }
  if (!row.nextChargeAt) return '—';
  const date = formatRenewalDate(row.nextChargeAt);
  const days = row.daysUntilCharge ?? daysUntilIso(row.nextChargeAt);
  if (days == null) return date;
  if (days < 0) return `${date} · overdue`;
  if (days === 0) return `${date} · today`;
  if (days === 1) return `${date} · in 1d`;
  return `${date} · in ${days}d`;
}

function daysUntilIso(iso: string): number | null {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function bucketLabel(bucket: RenewalRetentionBucket): string {
  switch (bucket) {
    case 'healthy':
      return 'Healthy';
    case 'cancelling':
      return 'Cancelling';
    case 'payment_issue':
      return 'Payment issue';
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

export function buildRenewalActions(summary: RenewalSummary): RenewalAction[] {
  const cancellingTitle = summary.nextCancellingName
    ? `Follow up with ${summary.nextCancellingName}`
    : 'Review cancelling members';
  const cancellingSubtitle = summary.nextCancellingAccessAt
    ? `Access ends ${formatRenewalDate(summary.nextCancellingAccessAt)}`
    : `${summary.cancellingCount} opted out of auto-renew`;

  return [
    {
      id: 'cancelling',
      title: cancellingTitle,
      subtitle: cancellingSubtitle,
      count: summary.cancellingCount,
      accent: '#FFB703',
      cta: summary.nextCancellingLeadId ? 'Open profile' : undefined,
      href: summary.nextCancellingLeadId ? `/customers/${summary.nextCancellingLeadId}` : undefined,
    },
    {
      id: 'payment',
      title: 'Payment issues',
      subtitle: 'Auto-renew may fail without a fix',
      count: summary.paymentIssueCount,
      accent: '#F43F5E',
      cta: 'View all',
      href: '/renewals?bucket=payment_issue',
    },
    {
      id: 'churned',
      title: 'Churned this month',
      subtitle: 'Members who lapsed recently',
      count: summary.churnedThisMonth,
      accent: '#5C65CF',
      cta: 'View churned',
      href: '/renewals?bucket=churned',
    },
  ];
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
      return summary.churnedCount;
    case 'healthy':
      return summary.healthyCount;
    case 'all':
      return summary.atRiskCount + summary.healthyCount + summary.churnedCount;
    default:
      return undefined;
  }
}

export function formatClv(paise: number): string {
  return formatInrFromPaise(paise);
}
