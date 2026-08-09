'use client';

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
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { MetaPurchaseDailyRow } from '@/types/crm';

type MetaPurchaseDailyTableProps = {
  rows: MetaPurchaseDailyRow[];
  windowDays: number;
  total: number;
  error?: string | null;
};

type DaySortKey = 'day' | 'purchases' | 'capiSent' | 'capiPendingOrFailed' | 'capiNotRecorded';

const perfCell = 'px-3 py-2 text-[12px]';
const perfHeader = 'px-3 py-2';

function countCellClass(value: number, warn = false): string {
  if (value <= 0) {
    return `${perfCell} tabular-nums text-slate-400`;
  }
  if (warn) {
    return `${perfCell} font-semibold tabular-nums text-amber-700`;
  }
  return `${perfCell} tabular-nums text-slate-800`;
}

export function MetaPurchaseDailyTable({ rows, windowDays, total, error }: MetaPurchaseDailyTableProps) {
  const [sortKey, setSortKey] = useState<DaySortKey>('day');
  const [sortDirection, setSortDirection] = useState<PerformanceSortDirection>('desc');

  const toggleSort = (key: DaySortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'day' ? 'desc' : 'desc');
  };

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'day':
          comparison = a.day.localeCompare(b.day);
          break;
        case 'purchases':
          comparison = a.purchases - b.purchases;
          break;
        case 'capiSent':
          comparison = a.capiSent - b.capiSent;
          break;
        case 'capiPendingOrFailed':
          comparison = a.capiPendingOrFailed - b.capiPendingOrFailed;
          break;
        case 'capiNotRecorded':
          comparison = a.capiNotRecorded - b.capiNotRecorded;
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
          purchases: acc.purchases + row.purchases,
          capiSent: acc.capiSent + row.capiSent,
          capiPendingOrFailed: acc.capiPendingOrFailed + row.capiPendingOrFailed,
          capiNotRecorded: acc.capiNotRecorded + row.capiNotRecorded,
        }),
        { purchases: 0, capiSent: 0, capiPendingOrFailed: 0, capiNotRecorded: 0 }
      ),
    [rows]
  );

  const subtitle = `Last ${windowDays} days`;

  return (
    <Card padding="none">
      <PerformanceSectionHeader
        title="Meta-influenced purchases"
        subtitle={`${subtitle} · ${total.toLocaleString()} purchases · skipped/historical rows count as not sent`}
      />
      {error ? <p className="px-4 pt-2 text-xs font-medium text-danger-press">{error}</p> : null}
      <DataTable tableClassName="table-fixed min-w-[640px]">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[23%]" />
          <col className="w-[23%]" />
        </colgroup>
        <DataTableHead>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Day (IST)"
              sortKey="day"
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
              label="CAPI sent"
              sortKey="capiSent"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Pending / failed"
              sortKey="capiPendingOrFailed"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell className={perfHeader}>
            <PerformanceSortableHeader
              label="Not in outbox"
              sortKey="capiNotRecorded"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {sortedRows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={5} className={`${perfCell} py-6 text-center text-slate-500`}>
                No meta-influenced purchases in this window.
              </DataTableCell>
            </DataTableRow>
          ) : (
            sortedRows.map((row) => (
              <DataTableRow key={row.day}>
                <DataTableCell className={`${perfCell} font-medium text-slate-800`}>{row.day}</DataTableCell>
                <DataTableCell className={countCellClass(row.purchases)}>{row.purchases}</DataTableCell>
                <DataTableCell className={countCellClass(row.capiSent)}>{row.capiSent}</DataTableCell>
                <DataTableCell className={countCellClass(row.capiPendingOrFailed, true)}>
                  {row.capiPendingOrFailed}
                </DataTableCell>
                <DataTableCell className={countCellClass(row.capiNotRecorded, true)}>
                  {row.capiNotRecorded}
                </DataTableCell>
              </DataTableRow>
            ))
          )}
          {sortedRows.length > 0 ? (
            <DataTableRow className="border-t-2 border-slate-200 bg-slate-50/80">
              <DataTableCell className={`${perfCell} font-semibold text-slate-700`}>Total</DataTableCell>
              <DataTableCell className={cn(countCellClass(totals.purchases), 'font-semibold')}>
                {totals.purchases}
              </DataTableCell>
              <DataTableCell className={cn(countCellClass(totals.capiSent), 'font-semibold')}>
                {totals.capiSent}
              </DataTableCell>
              <DataTableCell className={cn(countCellClass(totals.capiPendingOrFailed, true), 'font-semibold')}>
                {totals.capiPendingOrFailed}
              </DataTableCell>
              <DataTableCell className={cn(countCellClass(totals.capiNotRecorded, true), 'font-semibold')}>
                {totals.capiNotRecorded}
              </DataTableCell>
            </DataTableRow>
          ) : null}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
