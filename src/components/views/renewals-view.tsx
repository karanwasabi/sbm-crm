'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KpiCard } from '@/components/crm/kpi-card';
import { RenewalActionCard } from '@/components/crm/renewal-action-card';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { useCrmRenewalSummary } from '@/components/layout/crm/crm-renewal-summary-context';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { formatCompactInrFromPaise } from '@/lib/money';
import {
  RENEWAL_BUCKET_FILTERS,
  bucketLabel,
  bucketTone,
  buildRenewalActions,
  filterCount,
  formatChargeLabel,
  formatClv,
  renewalBucketHref,
  renewalSubtitle,
  riskDotClass,
  riskLabel,
  type RenewalBucketFilter,
} from '@/lib/renewal-display';
import { cn } from '@/lib/cn';
import type { RenewalRow, RenewalSummary } from '@/types/crm';

type RenewalsViewProps = {
  summary: RenewalSummary;
  rows: RenewalRow[];
  activeBucket: RenewalBucketFilter;
};

export function RenewalsView({ summary, rows, activeBucket }: RenewalsViewProps) {
  const router = useRouter();
  const { setRenewalSubtitle } = useCrmRenewalSummary();
  const [pendingBucket, setPendingBucket] = useState<RenewalBucketFilter | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const actions = buildRenewalActions(summary);

  const displayedBucket = pendingBucket ?? activeBucket;
  const isTableLoading = isNavigating || (pendingBucket !== null && pendingBucket !== activeBucket);

  const navigateBucket = (bucket: RenewalBucketFilter) => {
    if (bucket === activeBucket && pendingBucket === null) return;
    setPendingBucket(bucket);
    startTransition(() => {
      router.push(renewalBucketHref(bucket));
    });
  };

  useEffect(() => {
    if (pendingBucket !== null && pendingBucket === activeBucket && !isNavigating) {
      setPendingBucket(null);
    }
  }, [activeBucket, pendingBucket, isNavigating]);

  useEffect(() => {
    setRenewalSubtitle(renewalSubtitle(summary));
    return () => setRenewalSubtitle(null);
  }, [summary, setRenewalSubtitle]);

  return (
    <CrmPageLayout>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="At risk"
          value={String(summary.atRiskCount)}
          sub={`${formatCompactInrFromPaise(summary.atRiskMrrPaise)} MRR at risk`}
          accent="#F43F5E"
        />
        <KpiCard
          label="Cancelling"
          value={String(summary.cancellingCount)}
          sub="Opted out of auto-renew"
          accent="#FFB703"
        />
        <KpiCard
          label="Payment issues"
          value={String(summary.paymentIssueCount)}
          sub="Auto-renew may fail"
          accent="#F43F5E"
        />
        <KpiCard
          label="Auto-renewed this month"
          value={String(summary.autoRenewedThisMonth)}
          sub="Successful monthly charges"
          accent="#10B981"
        />
      </div>

      <Card padding="md">
        <SectionHead title="Action center" subtitle="Jump to retention filters" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {actions.map((action) => (
            <RenewalActionCard
              key={action.id}
              action={action}
              onNavigate={navigateBucket}
              navigatePending={isTableLoading && action.bucket === pendingBucket}
            />
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {RENEWAL_BUCKET_FILTERS.map((filter) => (
          <FilterChip
            key={filter.id}
            onClick={() => navigateBucket(filter.id)}
            active={displayedBucket === filter.id}
            pending={isTableLoading && pendingBucket === filter.id}
            count={filterCount(summary, filter.id)}
          >
            {filter.label}
          </FilterChip>
        ))}
      </div>

      <Card padding="none" className={cn(isTableLoading && 'pointer-events-none')}>
        <div className="p-5">
          <SectionHead
            title="Subscription retention"
            subtitle={
              isTableLoading
                ? 'Loading members…'
                : `${rows.length} member${rows.length === 1 ? '' : 's'} · sorted by risk`
            }
          />
        </div>
        {isTableLoading ? (
          <TableSkeleton columns={7} rows={5} showHeader embedded />
        ) : (
          <DataTable>
            <DataTableHead>
              {['Member', 'Cohort', 'Next charge / access', 'CLV', 'Status', 'Risk', 'Automation'].map((h) => (
                <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
              ))}
            </DataTableHead>
            <DataTableBody>
              {rows.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    No members match this filter.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                rows.map((row) => (
                  <DataTableRow
                    key={row.checkoutSessionId}
                    onClick={row.leadId ? () => router.push(`/customers/${row.leadId}`) : undefined}
                  >
                    <DataTableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                          {row.memberInitials}
                        </div>
                        <span className="font-semibold text-slate-800">{row.memberName}</span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>{row.cohortName}</DataTableCell>
                    <DataTableCell className="text-slate-600">{formatChargeLabel(row)}</DataTableCell>
                    <DataTableCell className="font-bold tabular-nums">{formatClv(row.lifetimePaidPaise)}</DataTableCell>
                    <DataTableCell>
                      <Pill tone={bucketTone(row.retentionBucket)}>{bucketLabel(row.retentionBucket)}</Pill>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${riskDotClass(row.risk)}`} />
                        {riskLabel(row.risk)}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-slate-400">—</DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        )}
      </Card>
    </CrmPageLayout>
  );
}
