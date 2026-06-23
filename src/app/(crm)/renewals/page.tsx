import { RenewalsView } from '@/components/views/renewals-view';
import { getRenewalSummary, listRenewals } from '@/utils/api';
import type { RenewalSummary } from '@/types/crm';
import type { RenewalBucketFilter } from '@/lib/renewal-display';

const EMPTY_SUMMARY: RenewalSummary = {
  atRiskCount: 0,
  atRiskMrrPaise: 0,
  cancellingCount: 0,
  paymentIssueCount: 0,
  churnedCount: 0,
  churnedThisMonth: 0,
  autoRenewedThisMonth: 0,
  healthyCount: 0,
};

export default async function RenewalsPage({ searchParams }: { searchParams: Promise<{ bucket?: string }> }) {
  const { bucket } = await searchParams;
  const activeBucket = (bucket?.trim() || 'at_risk') as RenewalBucketFilter;

  let summary = EMPTY_SUMMARY;
  let rows: Awaited<ReturnType<typeof listRenewals>> = [];

  try {
    [summary, rows] = await Promise.all([getRenewalSummary(), listRenewals(activeBucket)]);
  } catch {
    summary = EMPTY_SUMMARY;
    rows = [];
  }

  return <RenewalsView summary={summary} rows={rows} activeBucket={activeBucket} />;
}
