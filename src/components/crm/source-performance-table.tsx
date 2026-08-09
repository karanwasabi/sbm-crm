import Link from 'next/link';
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
import type { PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';
import type { ReactNode } from 'react';

type SourcePerformanceTableProps = {
  rows: SourcePerformanceRow[];
  window?: PerformanceReportMeta | null;
  subtitle?: string;
  headerRight?: ReactNode;
};

const mediumTone: Record<SourcePerformanceRow['medium'], 'paid' | 'organic' | 'offline'> = {
  paid: 'paid',
  organic: 'organic',
  offline: 'offline',
};

const DEFAULT_SUBTITLE =
  'Leads by created_at · Purchases by paid_at (IST). Meta row includes checkouts + renewals. CVR = leads created in window who paid in window.';

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

export function SourcePerformanceTable({ rows, window, subtitle, headerRight }: SourcePerformanceTableProps) {
  return (
    <Card padding="none">
      <div className="p-5">
        <SectionHead title="Source performance" subtitle={subtitle ?? DEFAULT_SUBTITLE} right={headerRight} />
      </div>
      <DataTable>
        <DataTableHead>
          {['Source', 'Medium', 'Leads', 'Purchases', 'CVR', 'CPL', 'CAC'].map((h) => (
            <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                No attributed leads in this window.
              </DataTableCell>
            </DataTableRow>
          ) : (
            rows.map((row) => (
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
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
