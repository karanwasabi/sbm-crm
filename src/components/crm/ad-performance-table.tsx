'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { fetchAdPerformance } from '@/app/(crm)/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { MarketingLabelCell } from '@/components/crm/marketing-label-cell';
import { PerformanceTablePagination } from '@/components/crm/performance-table-pagination';
import { PerformanceTableToolbar } from '@/components/crm/performance-table-toolbar';
import { PerformanceWindowSelector } from '@/components/crm/performance-window-selector';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { usePerformanceTableState } from '@/hooks/use-performance-table-state';
import { humanizeMarketingLabel } from '@/lib/marketing-labels';
import { formatPerformanceDateRange, type PerformanceWindowPreset } from '@/lib/performance-display';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { AdPerformanceRow, PerformanceReportMeta } from '@/types/crm';

type AdSortKey = 'ad' | 'adset' | 'campaign' | 'program' | 'leads' | 'paid' | 'cvr';

const AD_SORT_OPTIONS: Array<{ key: AdSortKey; label: string }> = [
  { key: 'leads', label: 'Leads' },
  { key: 'paid', label: 'Paid' },
  { key: 'cvr', label: 'CVR' },
  { key: 'ad', label: 'Ad' },
  { key: 'adset', label: 'Ad set' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'program', label: 'Program' },
];

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

function adSearchHaystack(row: AdPerformanceRow): string {
  return [row.adContent, row.adset, row.campaign, row.program]
    .flatMap((value) => [value, humanizeMarketingLabel(value)])
    .join(' ')
    .toLowerCase();
}

export function AdPerformanceTable() {
  const [rows, setRows] = useState<AdPerformanceRow[]>([]);
  const [window, setWindow] = useState<PerformanceReportMeta | null>(null);
  const [selected, setSelected] = useState<PerformanceWindowPreset>(90);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filterRow = useCallback((row: AdPerformanceRow, search: string) => {
    return adSearchHaystack(row).includes(search);
  }, []);

  const getSortValue = useCallback((row: AdPerformanceRow, key: AdSortKey) => {
    switch (key) {
      case 'ad':
        return humanizeMarketingLabel(row.adContent);
      case 'adset':
        return humanizeMarketingLabel(row.adset);
      case 'campaign':
        return humanizeMarketingLabel(row.campaign);
      case 'program':
        return humanizeMarketingLabel(row.program);
      case 'leads':
        return row.leads;
      case 'paid':
        return row.paid;
      case 'cvr':
        return row.cvr;
      default:
        return 0;
    }
  }, []);

  const table = usePerformanceTableState<AdPerformanceRow, AdSortKey>({
    rows,
    defaultSortKey: 'leads',
    filterRow,
    getSortValue,
  });

  const load = useCallback((days: PerformanceWindowPreset) => {
    startTransition(async () => {
      setError(null);
      const result = await fetchAdPerformance(days);
      if (result.ok) {
        setRows(result.rows);
        setWindow(result.window);
      } else {
        setError(result.error);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    load(90);
  }, [load]);

  const changeWindow = (days: PerformanceWindowPreset) => {
    if (days === selected) return;
    setSelected(days);
    load(days);
  };

  const subtitle = useMemo(() => formatPerformanceDateRange(window, selected), [window, selected]);

  return (
    <div className="flex flex-col gap-2">
      <Card padding="none">
        <div className="p-5">
          <SectionHead
            title="Ad performance"
            subtitle={subtitle}
            right={<PerformanceWindowSelector selected={selected} pending={isPending} onChange={changeWindow} />}
          />
        </div>
        <PerformanceTableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search ads, ad sets, campaigns…"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          sortOptions={AD_SORT_OPTIONS}
          onSortKeyChange={table.setSortKey}
          onSortDirectionChange={table.setSortDirection}
        />
        <DataTable tableClassName="table-fixed min-w-[1040px]">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
          </colgroup>
          <DataTableHead>
            {['Ad', 'Ad set', 'Campaign', 'Program', 'Leads', 'Paid', 'CVR'].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {table.pageRows.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {!loaded
                    ? 'Loading…'
                    : table.search
                      ? 'No ads match your search.'
                      : 'No leads with utm_content in this window.'}
                </DataTableCell>
              </DataTableRow>
            ) : (
              table.pageRows.map((row) => (
                <DataTableRow key={`${row.adContent}::${row.program}`}>
                  <DataTableCell className="align-top font-semibold text-slate-800">
                    <MarketingLabelCell value={row.adContent} />
                  </DataTableCell>
                  <DataTableCell className="align-top text-slate-600">
                    <MarketingLabelCell value={row.adset} />
                  </DataTableCell>
                  <DataTableCell className="align-top text-slate-600">
                    <MarketingLabelCell value={row.campaign} />
                  </DataTableCell>
                  <DataTableCell className="align-top text-slate-600">
                    <MarketingLabelCell value={row.program} />
                  </DataTableCell>
                  <DataTableCell className="align-top">
                    <DrilldownCell
                      href={buildPerformanceDrilldownHref({
                        mode: 'leads',
                        utmContent: row.adContent,
                        since: window?.since,
                        until: window?.until,
                      })}
                      value={row.leads}
                    />
                  </DataTableCell>
                  <DataTableCell className="align-top">
                    <DrilldownCell
                      href={buildPerformanceDrilldownHref({
                        mode: 'purchases',
                        utmContent: row.adContent,
                        since: window?.since,
                        until: window?.until,
                      })}
                      value={row.paid}
                      bold
                    />
                  </DataTableCell>
                  <DataTableCell className="align-top whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="relative h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="absolute top-0 bottom-0 left-0 rounded-full bg-brand"
                          style={{ width: `${Math.min(row.cvr * 200, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {Math.round(row.cvr * 100)}%
                      </span>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
        <PerformanceTablePagination
          page={table.page}
          totalPages={table.totalPages}
          pageStart={table.pageStart}
          pageEnd={table.pageEnd}
          totalRows={table.totalRows}
          onPageChange={table.setPage}
        />
      </Card>
      {error ? <p className="px-1 text-xs font-medium text-danger-press">{error}</p> : null}
    </div>
  );
}
