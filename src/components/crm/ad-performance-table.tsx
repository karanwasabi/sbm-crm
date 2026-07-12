'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { fetchAdPerformance } from '@/app/(crm)/actions';
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
import type { AdPerformanceRow } from '@/types/crm';

type WindowOption = { label: string; days: number | 'all' };

const WINDOW_OPTIONS: WindowOption[] = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 'all' },
];

function windowSubtitle(days: number | 'all'): string {
  if (days === 'all') return 'Interest-form leads by ad, all time';
  return `Interest-form leads by ad, last ${days} days`;
}

export function AdPerformanceTable() {
  const [rows, setRows] = useState<AdPerformanceRow[]>([]);
  const [selected, setSelected] = useState<number | 'all'>(90);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback((days: number | 'all') => {
    startTransition(async () => {
      setError(null);
      const result = await fetchAdPerformance(days);
      if (result.ok) {
        setRows(result.rows);
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
          <SectionHead title="Ad performance" subtitle={windowSubtitle(selected)} right={selector} />
        </div>
        <DataTable>
          <DataTableHead>
            {['Ad', 'Ad set', 'Program', 'Campaign', 'Leads', 'Paid', 'CVR'].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {!loaded ? 'Loading…' : 'No ad-attributed interest-form leads in this window.'}
                </DataTableCell>
              </DataTableRow>
            ) : (
              rows.map((row) => (
                <DataTableRow key={`${row.adContent}::${row.program}`}>
                  <DataTableCell className="font-semibold text-slate-800">
                    <span className="block max-w-[220px] truncate" title={row.adContent}>
                      {row.adContent}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-slate-600">{row.adset || '—'}</DataTableCell>
                  <DataTableCell className="text-slate-600">{row.program || '—'}</DataTableCell>
                  <DataTableCell className="text-slate-600">{row.campaign || '—'}</DataTableCell>
                  <DataTableCell className="tabular-nums">{row.leads.toLocaleString()}</DataTableCell>
                  <DataTableCell className="font-bold tabular-nums">{row.paid}</DataTableCell>
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
