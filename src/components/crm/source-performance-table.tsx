'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { ResponsiveList } from '@/components/crm/responsive-list';
import { PerformanceSectionHeader } from '@/components/crm/performance-section-header';
import { PerformanceSortableHeader } from '@/components/crm/performance-sortable-header';
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { OfflineMetaEnrollmentsSummary, PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

type SourcePerformanceTableProps = {
  rows: SourcePerformanceRow[];
  window?: PerformanceReportMeta | null;
  offlineMetaEnrollments?: OfflineMetaEnrollmentsSummary | null;
  subtitle?: string;
  headerRight?: ReactNode;
};

type SourceSortKey = 'source' | 'leads' | 'paidNew' | 'cvr';

const perfCell = 'px-3 py-2 text-[12px]';
const perfHeader = 'px-3 py-2';

const mediumTone: Record<SourcePerformanceRow['medium'], 'paid' | 'organic' | 'offline'> = {
  paid: 'paid',
  organic: 'organic',
  offline: 'offline',
};

function formatRupees(value: number | null): string {
  if (value == null) return '—';
  return `₹${value.toLocaleString('en-IN')}`;
}

function DrilldownCell({ href, value, bold }: { href: string; value: number; bold?: boolean }) {
  if (value <= 0) {
    return <span className={bold ? 'font-bold tabular-nums' : 'tabular-nums'}>{value}</span>;
  }
  return (
    <Link
      href={href}
      className={
        bold
          ? 'font-bold text-brand tabular-nums underline-offset-2 hover:underline'
          : 'text-brand tabular-nums underline-offset-2 hover:underline'
      }
    >
      {value.toLocaleString()}
    </Link>
  );
}

export function SourcePerformanceTable({
  rows,
  window,
  offlineMetaEnrollments,
  subtitle,
  headerRight,
}: SourcePerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SourceSortKey>('leads');
  const [sortDirection, setSortDirection] = useState<PerformanceSortDirection>('desc');

  const toggleSort = useCallback(
    (key: SourceSortKey) => {
      if (sortKey === key) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return;
      }
      setSortKey(key);
      setSortDirection('desc');
    },
    [sortKey]
  );

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'source':
          comparison = a.source.localeCompare(b.source, undefined, { sensitivity: 'base' });
          break;
        case 'paidNew':
          comparison = a.paidNew - b.paidNew;
          break;
        case 'cvr':
          comparison = a.cvr - b.cvr;
          break;
        case 'leads':
        default:
          comparison = a.leads - b.leads;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return next;
  }, [rows, sortKey, sortDirection]);

  return (
    <Card padding="none">
      <PerformanceSectionHeader title="Source performance" subtitle={subtitle} controls={headerRight} />
      <ResponsiveList
        mobile={
          sortedRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No attributed leads in this window.</p>
          ) : (
            <div className="flex flex-col gap-2 px-3 pb-3">
              {sortedRows.map((row) => (
                <div key={row.sourceKey} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-800">{row.source}</p>
                    <Pill tone={mediumTone[row.medium]}>{row.medium}</Pill>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-slate-600">
                    <div>
                      Leads{' '}
                      <DrilldownCell
                        href={buildPerformanceDrilldownHref({
                          mode: 'leads',
                          sourceKey: row.sourceKey,
                          since: window?.since,
                          until: window?.until,
                        })}
                        value={row.leads}
                      />
                    </div>
                    <div>
                      Purchases{' '}
                      <DrilldownCell
                        href={buildPerformanceDrilldownHref({
                          mode: 'purchases',
                          sourceKey: row.sourceKey,
                          purchaseKind: 'new',
                          since: window?.since,
                          until: window?.until,
                        })}
                        value={row.paidNew}
                        bold
                      />
                    </div>
                    <div>CVR {Math.round(row.cvr * 100)}%</div>
                    <div>CAC {formatRupees(row.cac)}</div>
                  </div>
                </div>
              ))}
              {offlineMetaEnrollments && offlineMetaEnrollments.count > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="font-semibold text-slate-700">Offline Meta enrollments</p>
                  <p className="mt-1 text-[12px] text-slate-600">
                    Purchases{' '}
                    <DrilldownCell
                      href={buildPerformanceDrilldownHref({
                        mode: 'purchases',
                        sourceKey: 'meta_influenced',
                        offlineCrmPaid: true,
                        since: window?.since,
                        until: window?.until,
                      })}
                      value={offlineMetaEnrollments.count}
                      bold
                    />
                  </p>
                </div>
              ) : null}
            </div>
          )
        }
        desktop={
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell className={perfHeader}>
                <PerformanceSortableHeader
                  label="Source"
                  sortKey="source"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>Medium</DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>
                <PerformanceSortableHeader
                  label="Leads"
                  sortKey="leads"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>
                <PerformanceSortableHeader
                  label="Purchases"
                  sortKey="paidNew"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>
                <PerformanceSortableHeader
                  label="CVR"
                  sortKey="cvr"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>CPL</DataTableHeaderCell>
              <DataTableHeaderCell className={perfHeader}>CAC</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {sortedRows.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className={`${perfCell} py-6 text-center text-slate-500`}>
                    No attributed leads in this window.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                sortedRows.map((row) => (
                  <DataTableRow key={row.sourceKey}>
                    <DataTableCell className={`${perfCell} font-semibold text-slate-800`}>{row.source}</DataTableCell>
                    <DataTableCell className={perfCell}>
                      <Pill tone={mediumTone[row.medium]}>{row.medium}</Pill>
                    </DataTableCell>
                    <DataTableCell className={perfCell}>
                      <DrilldownCell
                        href={buildPerformanceDrilldownHref({
                          mode: 'leads',
                          sourceKey: row.sourceKey,
                          since: window?.since,
                          until: window?.until,
                        })}
                        value={row.leads}
                      />
                    </DataTableCell>
                    <DataTableCell className={perfCell}>
                      <DrilldownCell
                        href={buildPerformanceDrilldownHref({
                          mode: 'purchases',
                          sourceKey: row.sourceKey,
                          purchaseKind: 'new',
                          since: window?.since,
                          until: window?.until,
                        })}
                        value={row.paidNew}
                        bold
                      />
                    </DataTableCell>
                    <DataTableCell className={perfCell}>
                      <div className="flex items-center gap-1.5">
                        <div className="relative h-1 w-12 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute top-0 bottom-0 left-0 rounded-full bg-brand"
                            style={{ width: `${Math.min(row.cvr * 200, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 tabular-nums">
                          {Math.round(row.cvr * 100)}%
                        </span>
                      </div>
                    </DataTableCell>
                    <DataTableCell className={`${perfCell} font-semibold tabular-nums`}>
                      {formatRupees(row.cpl)}
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
                  </DataTableRow>
                ))
              )}
              {offlineMetaEnrollments && offlineMetaEnrollments.count > 0 ? (
                <DataTableRow className="border-t-2 border-slate-200 bg-slate-50/80">
                  <DataTableCell className={`${perfCell} font-semibold text-slate-700`}>
                    <span className="block">Offline Meta enrollments</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-500">CRM offline enrolls</span>
                  </DataTableCell>
                  <DataTableCell className={perfCell}>
                    <Pill tone="offline">offline</Pill>
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
                  <DataTableCell className={perfCell}>
                    <DrilldownCell
                      href={buildPerformanceDrilldownHref({
                        mode: 'purchases',
                        sourceKey: 'meta_influenced',
                        offlineCrmPaid: true,
                        since: window?.since,
                        until: window?.until,
                      })}
                      value={offlineMetaEnrollments.count}
                      bold
                    />
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
                  <DataTableCell className={`${perfCell} text-slate-400`}>—</DataTableCell>
                </DataTableRow>
              ) : null}
            </DataTableBody>
          </DataTable>
        }
      />
    </Card>
  );
}
