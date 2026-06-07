import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import type { AttendanceRow } from '@/types/crm';

type AttendanceTableProps = {
  rows: AttendanceRow[];
};

export function AttendanceTable({ rows }: AttendanceTableProps) {
  return (
    <Card padding="none">
      <div className="p-5">
        <SectionHead title="Attendance roster" subtitle="Live session completion" />
      </div>
      <DataTable>
        <DataTableHead>
          {['Name', 'Cohort', 'Sessions', 'Completion', 'Status'].map((h) => (
            <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {rows.map((row) => (
            <DataTableRow key={row.name}>
              <DataTableCell className="font-semibold text-slate-800">{row.name}</DataTableCell>
              <DataTableCell>{row.cohort}</DataTableCell>
              <DataTableCell className="tabular-nums">
                {row.sessions}/{row.total}
              </DataTableCell>
              <DataTableCell className="font-bold tabular-nums">{row.pct}%</DataTableCell>
              <DataTableCell className={row.status === 'At risk' ? 'font-semibold text-danger-press' : 'font-semibold'}>
                {row.status}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
