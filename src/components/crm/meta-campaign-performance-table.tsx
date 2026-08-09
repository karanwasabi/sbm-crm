'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { fetchMetaCampaignPerformance } from '@/app/(crm)/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { MarketingLabelCell } from '@/components/crm/marketing-label-cell';
import { PerformanceSectionHeader } from '@/components/crm/performance-section-header';
import { PerformanceSortableHeader } from '@/components/crm/performance-sortable-header';
import { PerformanceTablePagination } from '@/components/crm/performance-table-pagination';
import { PerformanceTableSearch } from '@/components/crm/performance-table-search';
import { PerformanceWindowSelector } from '@/components/crm/performance-window-selector';
import { Card } from '@/components/ui/card';
import { usePerformanceTableState } from '@/hooks/use-performance-table-state';
import { humanizeMarketingLabel } from '@/lib/marketing-labels';
import {
  formatMarketingActivityDate,
  formatPerformanceDateRange,
  type PerformanceWindowPreset,
} from '@/lib/performance-display';
import { buildPerformanceDrilldownHref } from '@/lib/performance-drilldown-url';
import type { MetaCampaignPerformanceRow, PerformanceReportMeta } from '@/types/crm';

const UNATTRIBUTED_CAMPAIGN_ID = '__unattributed__';

type CampaignSortKey = 'campaign' | 'leads' | 'paid' | 'cvr' | 'spend' | 'cpl' | 'cac' | 'lastActivity';

const perfCell = 'px-3 py-2 text-[12px]';
const perfHeader = 'px-3 py-2';

const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatRupees(value: number | null): string {
  if (value == null) return '—';
  return `₹${rupeeFormatter.format(value)}`;
}

function campaignActivityLabel(at?: string | null): string | undefined {
  const formatted = formatMarketingActivityDate(at);
  return formatted ? `Last active · ${formatted}` : undefined;
}

function campaignSearchHaystack(row: MetaCampaignPerformanceRow): string {
  return [row.campaignName, row.campaignId, humanizeMarketingLabel(row.campaignName)].join(' ').toLowerCase();
}

export function MetaCampaignPerformanceTable() {
  const [rows, setRows] = useState<MetaCampaignPerformanceRow[]>([]);
  const [window, setWindow] = useState<PerformanceReportMeta | null>(null);
  const [selected, setSelected] = useState<PerformanceWindowPreset>(90);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filterRow = useCallback((row: MetaCampaignPerformanceRow, search: string) => {
    return campaignSearchHaystack(row).includes(search);
  }, []);

  const getSortValue = useCallback((row: MetaCampaignPerformanceRow, key: CampaignSortKey) => {
    switch (key) {
      case 'campaign':
        return humanizeMarketingLabel(row.campaignName) || row.campaignId;
      case 'leads':
        return row.leads;
      case 'paid':
        return row.paid;
      case 'cvr':
        return row.cvr;
      case 'spend':
        return row.spend ?? -1;
      case 'cpl':
        return row.cpl ?? -1;
      case 'cac':
        return row.cac ?? -1;
      case 'lastActivity':
        return row.lastActivityAt ? Date.parse(row.lastActivityAt) : 0;
      default:
        return 0;
    }
  }, []);

  const table = usePerformanceTableState<MetaCampaignPerformanceRow, CampaignSortKey>({
    rows,
    defaultSortKey: 'lastActivity',
    filterRow,
    getSortValue,
  });

  const load = useCallback((days: PerformanceWindowPreset) => {
    startTransition(async () => {
      setError(null);
      const result = await fetchMetaCampaignPerformance(days);
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
        <PerformanceSectionHeader
          title="Campaign performance"
          subtitle={subtitle}
          search={
            <PerformanceTableSearch value={table.search} onChange={table.setSearch} placeholder="Search campaigns…" />
          }
          controls={<PerformanceWindowSelector selected={selected} pending={isPending} onChange={changeWindow} />}
        />
        <DataTable tableClassName="table-fixed min-w-[920px]">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <DataTableHead>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="Campaign"
                sortKey="campaign"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="Leads"
                sortKey="leads"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="Purchases"
                sortKey="paid"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="CVR"
                sortKey="cvr"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="Spend"
                sortKey="spend"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="CPL"
                sortKey="cpl"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={perfHeader}>
              <PerformanceSortableHeader
                label="CAC"
                sortKey="cac"
                activeSortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
            </DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {table.pageRows.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7} className={`${perfCell} py-6 text-center text-slate-500`}>
                  {!loaded
                    ? 'Loading…'
                    : table.search
                      ? 'No campaigns match your search.'
                      : 'No Meta campaign data in this window. Run the ad-spend sync and ensure leads carry a campaign id.'}
                </DataTableCell>
              </DataTableRow>
            ) : (
              table.pageRows.map((row) => (
                <DataTableRow key={row.campaignId}>
                  <DataTableCell className={`${perfCell} align-top font-semibold text-slate-800`}>
                    <MarketingLabelCell
                      value={row.campaignName}
                      secondary={campaignActivityLabel(row.lastActivityAt)}
                      title={
                        row.campaignId === UNATTRIBUTED_CAMPAIGN_ID
                          ? row.campaignName
                          : `${row.campaignName}\nMeta campaign ID: ${row.campaignId}`
                      }
                    />
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} align-top whitespace-nowrap tabular-nums`}>
                    {row.leads > 0 ? (
                      <Link
                        href={buildPerformanceDrilldownHref({
                          mode: 'leads',
                          sourceKey: 'meta_influenced',
                          campaignId: row.campaignId === UNATTRIBUTED_CAMPAIGN_ID ? undefined : row.campaignId,
                          campaignUnattributed: row.campaignId === UNATTRIBUTED_CAMPAIGN_ID,
                          since: window?.since,
                          until: window?.until,
                        })}
                        className="text-brand underline-offset-2 hover:underline"
                      >
                        {row.leads.toLocaleString()}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} align-top font-bold whitespace-nowrap tabular-nums`}>
                    {row.paid > 0 ? (
                      <Link
                        href={buildPerformanceDrilldownHref({
                          mode: 'purchases',
                          sourceKey: 'meta_influenced',
                          campaignId: row.campaignId === UNATTRIBUTED_CAMPAIGN_ID ? undefined : row.campaignId,
                          campaignUnattributed: row.campaignId === UNATTRIBUTED_CAMPAIGN_ID,
                          since: window?.since,
                          until: window?.until,
                        })}
                        className="text-brand underline-offset-2 hover:underline"
                      >
                        {row.paid}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} align-top whitespace-nowrap`}>
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
                  <DataTableCell className={`${perfCell} align-top whitespace-nowrap tabular-nums`}>
                    {formatRupees(row.spend)}
                  </DataTableCell>
                  <DataTableCell className={`${perfCell} align-top whitespace-nowrap tabular-nums`}>
                    {formatRupees(row.cpl)}
                  </DataTableCell>
                  <DataTableCell
                    className={
                      row.cac != null && row.cac > 500
                        ? `${perfCell} align-top font-semibold whitespace-nowrap text-danger-press tabular-nums`
                        : `${perfCell} align-top font-semibold whitespace-nowrap tabular-nums`
                    }
                  >
                    {formatRupees(row.cac)}
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
