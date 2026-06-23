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
import type { LeadMedium, SourcePerformanceRow } from '@/types/crm';

type SourcePerformanceTableProps = {
  rows: SourcePerformanceRow[];
};

const mediumTone: Record<LeadMedium, 'paid' | 'organic' | 'offline'> = {
  paid: 'paid',
  organic: 'organic',
  offline: 'offline',
};

export function SourcePerformanceTable({ rows }: SourcePerformanceTableProps) {
  return (
    <Card padding="none">
      <div className="p-5">
        <SectionHead title="Source performance" subtitle="Lead volume + conversion by UTM source" />
      </div>
      <DataTable>
        <DataTableHead>
          {['Source', 'Medium', 'Leads', 'Paid', 'CVR', 'CAC'].map((h) => (
            <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                No attributed leads yet. Import a CSV from Meta Leads Center.
              </DataTableCell>
            </DataTableRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.source}>
                <DataTableCell className="font-semibold text-slate-800">{row.source}</DataTableCell>
                <DataTableCell>
                  <Pill tone={mediumTone[row.medium]}>{row.medium}</Pill>
                </DataTableCell>
                <DataTableCell className="tabular-nums">{row.leads.toLocaleString()}</DataTableCell>
                <DataTableCell className="font-bold tabular-nums">{row.paid}</DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="absolute top-0 bottom-0 left-0 rounded-full bg-brand"
                        style={{ width: `${row.cvr * 200}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tabular-nums">{Math.round(row.cvr * 100)}%</span>
                  </div>
                </DataTableCell>
                <DataTableCell
                  className={
                    row.cac != null && row.cac > 500
                      ? 'font-semibold text-danger-press tabular-nums'
                      : 'font-semibold tabular-nums'
                  }
                >
                  {row.cac != null ? `₹${row.cac}` : '—'}
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
