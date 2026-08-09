'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { fetchMetaCampaignPerformance } from '@/app/(crm)/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { SectionHead } from '@/components/ui/section-head';
import { buildPerformanceDrilldownHref, performanceWindowSubtitle } from '@/lib/performance-drilldown-url';
import type { MetaCampaignPerformanceRow, PerformanceReportMeta } from '@/types/crm';

const UNATTRIBUTED_CAMPAIGN_ID = '__unattributed__';

type WindowOption = { label: string; days: number | 'all' };

const WINDOW_OPTIONS: WindowOption[] = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 'all' },
];

const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatRupees(value: number | null): string {
  if (value == null) return '—';
  return `₹${rupeeFormatter.format(value)}`;
}

function windowSubtitle(days: number | 'all', window: PerformanceReportMeta | null): string {
  return `Leads by created_at · Purchases by paid_at · ${performanceWindowSubtitle(window, days)}`;
}

export function MetaCampaignPerformanceTable() {
  const [rows, setRows] = useState<MetaCampaignPerformanceRow[]>([]);
  const [window, setWindow] = useState<PerformanceReportMeta | null>(null);
  const [selected, setSelected] = useState<number | 'all'>(90);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback((days: number | 'all') => {
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

  const changeWindow = (days: number | 'all') => {
    if (days === selected) return;
    setSelected(days);
    load(days);
  };

  const selector = (
    <div className="flex items-center gap-1.5">
      {WINDOW_OPTIONS.map((option) => (
        <FilterChip
          key={option.label}
          active={option.days === selected}
          pending={isPending && option.days === selected}
          onClick={() => changeWindow(option.days)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Card padding="none">
        <div className="p-5">
          <SectionHead title="Campaign performance" subtitle={windowSubtitle(selected, window)} right={selector} />
        </div>
        <DataTable>
          <DataTableHead>
            {['Campaign', 'Leads', 'Purchases', 'CVR', 'Spend', 'CPL', 'CAC'].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {!loaded
                    ? 'Loading…'
                    : 'No Meta campaign data in this window. Run the ad-spend sync and ensure leads carry a campaign id.'}
                </DataTableCell>
              </DataTableRow>
            ) : (
              rows.map((row) => (
                <DataTableRow key={row.campaignId}>
                  <DataTableCell className="font-semibold text-slate-800">
                    <span className="block max-w-[240px] truncate" title={row.campaignName}>
                      {row.campaignName}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="tabular-nums">
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
                  <DataTableCell className="font-bold tabular-nums">
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
                  <DataTableCell>
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
                  <DataTableCell className="tabular-nums">{formatRupees(row.spend)}</DataTableCell>
                  <DataTableCell className="tabular-nums">{formatRupees(row.cpl)}</DataTableCell>
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
          </DataTableBody>
        </DataTable>
      </Card>
      {error ? <p className="px-1 text-xs font-medium text-danger-press">{error}</p> : null}
    </div>
  );
}
