'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { PerformanceSectionHeader } from '@/components/crm/performance-section-header';
import { PerformanceSortableHeader } from '@/components/crm/performance-sortable-header';
import { Card } from '@/components/ui/card';
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { MetaAcquisitionByPlanRow, PerformanceReportMeta } from '@/types/crm';

type MetaAcquisitionByPlanTableProps = {
  rows: MetaAcquisitionByPlanRow[];
  window?: PerformanceReportMeta | null;
  subtitle?: string;
};

type SortKey = 'plan' | 'purchases' | 'revenue' | 'spend' | 'cac' | 'roas' | 'contribution';

const perfCell = 'px-3 py-2 text-[12px]';
const perfHeader = 'px-3 py-2';

const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatRupees(value: number | null): string {
  if (value == null) return '—';
  return `₹${rupeeFormatter.format(value)}`;
}

function formatRoas(value: number | null): string {
  if (value == null) return '—';
  return `${value.toFixed(2)}x`;
}

export function MetaAcquisitionByPlanTable({ rows, window, subtitle }: MetaAcquisitionByPlanTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('plan');
  const [sortDirection, setSortDirection] = useState<PerformanceSortDirection>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'plan' ? 'asc' : 'desc');
  };

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      // Keep blended row at the bottom unless sorting by plan ascending.
      if (a.isBlended !== b.isBlended && sortKey !== 'plan') {
        return a.isBlended ? 1 : -1;
      }
      let comparison = 0;
      switch (sortKey) {
        case 'purchases':
          comparison = a.purchases - b.purchases;
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'spend':
          comparison = (a.attributedSpend ?? -1) - (b.attributedSpend ?? -1);
          break;
        case 'cac':
          comparison = (a.cac ?? -1) - (b.cac ?? -1);
          break;
        case 'roas':
          comparison = (a.roas ?? -1) - (b.roas ?? -1);
          break;
        case 'contribution':
          comparison =
            (a.contributionAfterAds ?? Number.MIN_SAFE_INTEGER) - (b.contributionAfterAds ?? Number.MIN_SAFE_INTEGER);
          break;
        case 'plan':
        default:
          if (a.isBlended !== b.isBlended) {
            comparison = a.isBlended ? 1 : -1;
          } else {
            comparison = a.planLabel.localeCompare(b.planLabel);
          }
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return next;
  }, [rows, sortKey, sortDirection]);

  return (
    <Card padding="none">
      <PerformanceSectionHeader
        title="Meta acquisition by plan"
        subtitle={
          subtitle ??
          'New Meta acquisitions only · ad spend shared by purchase count · contribution = revenue − attributed spend'
        }
      />
      <DataTable>
        <DataTableHead>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Plan"
              sortKey="plan"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Purchases"
              sortKey="purchases"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Revenue"
              sortKey="revenue"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Ad spend"
              sortKey="spend"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="CAC"
              sortKey="cac"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="ROAS"
              sortKey="roas"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Contribution after ads"
              sortKey="contribution"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {sortedRows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className={`${perfCell} py-6 text-center text-slate-500`}>
                No Meta trial acquisitions in this window.
              </DataTableCell>
            </DataTableRow>
          ) : (
            sortedRows.map((row) => (
              <DataTableRow
                key={row.planKey}
                className={row.isBlended ? 'border-t-2 border-slate-200 bg-slate-50/80' : undefined}
              >
                <DataTableCell className={`${perfCell} font-semibold text-slate-800`}>{row.planLabel}</DataTableCell>
                <DataTableCell className={`${perfCell} font-bold tabular-nums`}>
                  {!row.isBlended && row.purchases > 0 ? (
                    <Link
                      href={buildPerformanceDrilldownHref({
                        mode: 'purchases',
                        sourceKey: 'meta_influenced',
                        purchaseKind: 'new',
                        since: window?.since,
                        until: window?.until,
                      })}
                      className="text-brand underline-offset-2 hover:underline"
                    >
                      {row.purchases}
                    </Link>
                  ) : (
                    row.purchases
                  )}
                </DataTableCell>
                <DataTableCell className={`${perfCell} font-semibold tabular-nums`}>
                  {formatRupees(row.revenue)}
                </DataTableCell>
                <DataTableCell className={`${perfCell} tabular-nums`}>
                  {formatRupees(row.attributedSpend)}
                </DataTableCell>
                <DataTableCell
                  className={
                    row.cac != null && row.cac > 500
                      ? `${perfCell} font-semibold text-danger-press tabular-nums`
                      : `${perfCell} font-semibold tabular-nums`
                  }
                >
                  {formatRupees(row.cac)}
                </DataTableCell>
                <DataTableCell className={`${perfCell} tabular-nums`}>{formatRoas(row.roas)}</DataTableCell>
                <DataTableCell
                  className={
                    row.contributionAfterAds != null && row.contributionAfterAds < 0
                      ? `${perfCell} font-semibold text-danger-press tabular-nums`
                      : `${perfCell} font-semibold tabular-nums`
                  }
                >
                  {formatRupees(row.contributionAfterAds)}
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
