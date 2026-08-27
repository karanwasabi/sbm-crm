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
import { Pill } from '@/components/ui/pill';
import { Card } from '@/components/ui/card';
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';
import { humanizeMarketingLabel } from '@/lib/marketing-labels';
import { formatMarketingActivityDate } from '@/lib/performance-display';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { MetaRenewalsRow, PerformanceReportMeta } from '@/types/crm';

type MetaRenewalsTableProps = {
  rows: MetaRenewalsRow[];
  window?: PerformanceReportMeta | null;
  subtitle?: string;
};

type SortKey = 'category' | 'renewals' | 'revenue' | 'lastActivity';

const perfCell = 'px-3 py-2 text-[12px]';
const perfHeader = 'px-3 py-2';

const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatRupees(value: number): string {
  return `₹${rupeeFormatter.format(value)}`;
}

function bucketLabel(bucket: string): string {
  return bucket === 'old_students' ? 'Old students (Meta)' : 'Meta';
}

function bucketTone(bucket: string): 'paid' | 'offline' {
  return bucket === 'old_students' ? 'offline' : 'paid';
}

export function MetaRenewalsTable({ rows, window, subtitle }: MetaRenewalsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('renewals');
  const [sortDirection, setSortDirection] = useState<PerformanceSortDirection>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'category':
          comparison = a.renewalCategory.localeCompare(b.renewalCategory);
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'lastActivity':
          comparison =
            (a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0) -
            (b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0);
          break;
        case 'renewals':
        default:
          comparison = a.renewals - b.renewals;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return next;
  }, [rows, sortKey, sortDirection]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          renewals: acc.renewals + row.renewals,
          revenue: acc.revenue + row.revenue,
        }),
        { renewals: 0, revenue: 0 }
      ),
    [rows]
  );

  return (
    <Card padding="none">
      <PerformanceSectionHeader
        title="Meta-influenced renewals"
        subtitle={
          subtitle ?? 'Counts and revenue only — renewals are not in Meta CAC and are not sent as Meta Purchase events'
        }
      />
      <DataTable>
        <DataTableHead>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Category"
              sortKey="category"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>Bucket</DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>Plan family</DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Renewals"
              sortKey="renewals"
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
              label="Last activity"
              sortKey="lastActivity"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {sortedRows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={6} className={`${perfCell} py-6 text-center text-slate-500`}>
                No Meta-influenced renewals in this window.
              </DataTableCell>
            </DataTableRow>
          ) : (
            sortedRows.map((row) => {
              const sourceKey = row.bucket === 'old_students' ? 'meta_influenced_old_students' : 'meta_influenced';
              return (
                <DataTableRow key={`${row.bucket}:${row.renewalCategory}:${row.planFamily}`}>
                  <DataTableCell className={`${perfCell} font-semibold text-slate-800`}>
                    {humanizeMarketingLabel(row.renewalCategory)}
                  </DataTableCell>
                  <DataTableCell className={perfCell}>
                    <Pill tone={bucketTone(row.bucket)}>{bucketLabel(row.bucket)}</Pill>
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-600`}>
                    {humanizeMarketingLabel(row.planFamily)}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} font-bold tabular-nums`}>
                    {row.renewals > 0 ? (
                      <Link
                        href={buildPerformanceDrilldownHref({
                          mode: 'purchases',
                          sourceKey,
                          purchaseKind: 'renewal',
                          since: window?.since,
                          until: window?.until,
                        })}
                        className="text-brand underline-offset-2 hover:underline"
                      >
                        {row.renewals}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} font-semibold tabular-nums`}>
                    {formatRupees(row.revenue)}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-600`}>
                    {formatMarketingActivityDate(row.lastActivityAt) ?? '—'}
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}
          {sortedRows.length > 0 ? (
            <DataTableRow className="border-t-2 border-slate-200 bg-slate-50/80">
              <DataTableCell className={`${perfCell} font-semibold text-slate-700`}>Total</DataTableCell>
              <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
              <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
              <DataTableCell className={`${perfCell} font-semibold tabular-nums`}>{totals.renewals}</DataTableCell>
              <DataTableCell className={`${perfCell} font-semibold tabular-nums`}>
                {formatRupees(totals.revenue)}
              </DataTableCell>
              <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
            </DataTableRow>
          ) : null}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
