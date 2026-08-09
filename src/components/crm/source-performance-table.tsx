'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { OfflineMetaEnrollmentsSummary, PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

type SourcePerformanceTableProps = {
  rows: SourcePerformanceRow[];
  window?: PerformanceReportMeta | null;
  offlineMetaEnrollments?: OfflineMetaEnrollmentsSummary | null;
  subtitle?: string;
  headerRight?: ReactNode;
};

type SourceSortKey = 'source' | 'leads' | 'paid' | 'cvr';

const SOURCE_SORT_OPTIONS: Array<{ key: SourceSortKey; label: string }> = [
  { key: 'leads', label: 'Leads' },
  { key: 'paid', label: 'Purchases' },
  { key: 'cvr', label: 'CVR' },
  { key: 'source', label: 'Source' },
];

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

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      switch (sortKey) {
        case 'source':
          return a.source.localeCompare(b.source);
        case 'paid':
          return b.paid - a.paid;
        case 'cvr':
          return b.cvr - a.cvr;
        case 'leads':
        default:
          return b.leads - a.leads;
      }
    });
    return next;
  }, [rows, sortKey]);

  return (
    <Card padding="none">
      <div className="p-5">
        <SectionHead title="Source performance" subtitle={subtitle} right={headerRight} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
        <label className="text-xs font-semibold text-slate-500">Sort by</label>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SourceSortKey)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ring-brand/20 outline-none focus:ring-2"
        >
          {SOURCE_SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <DataTable>
        <DataTableHead>
          {['Source', 'Medium', 'Leads', 'Purchases', 'CVR', 'CPL', 'CAC'].map((h) => (
            <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {sortedRows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                No attributed leads in this window.
              </DataTableCell>
            </DataTableRow>
          ) : (
            sortedRows.map((row) => (
              <DataTableRow key={row.sourceKey}>
                <DataTableCell className="font-semibold text-slate-800">{row.source}</DataTableCell>
                <DataTableCell>
                  <Pill tone={mediumTone[row.medium]}>{row.medium}</Pill>
                </DataTableCell>
                <DataTableCell>
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
                <DataTableCell>
                  <DrilldownCell
                    href={buildPerformanceDrilldownHref({
                      mode: 'purchases',
                      sourceKey: row.sourceKey,
                      since: window?.since,
                      until: window?.until,
                    })}
                    value={row.paid}
                    bold
                  />
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="absolute top-0 bottom-0 left-0 rounded-full bg-brand"
                        style={{ width: `${Math.min(row.cvr * 200, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tabular-nums">{Math.round(row.cvr * 100)}%</span>
                  </div>
                </DataTableCell>
                <DataTableCell className="font-semibold tabular-nums">{formatRupees(row.cpl)}</DataTableCell>
                <DataTableCell
                  className={
                    row.cac != null && row.cac > 500
                      ? 'font-semibold text-danger-press tabular-nums'
                      : 'font-semibold tabular-nums'
                  }
                >
                  {formatRupees(row.cac)}
                </DataTableCell>
              </DataTableRow>
            ))
          )}
          {offlineMetaEnrollments && offlineMetaEnrollments.count > 0 ? (
            <DataTableRow className="border-t-2 border-slate-200 bg-slate-50/80">
              <DataTableCell className="font-semibold text-slate-700">
                <span className="block">Offline Meta enrollments</span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">CRM offline enrolls</span>
              </DataTableCell>
              <DataTableCell>
                <Pill tone="offline">offline</Pill>
              </DataTableCell>
              <DataTableCell className="text-slate-400">—</DataTableCell>
              <DataTableCell>
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
              <DataTableCell className="text-slate-400">—</DataTableCell>
              <DataTableCell className="text-slate-400">—</DataTableCell>
              <DataTableCell className="text-slate-400">—</DataTableCell>
            </DataTableRow>
          ) : null}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
