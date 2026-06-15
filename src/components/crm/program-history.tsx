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
import type { ProgramHistoryItem } from '@/types/crm';

type ProgramHistoryProps = {
  items: ProgramHistoryItem[];
};

export function ProgramHistory({ items }: ProgramHistoryProps) {
  return (
    <Card padding="none">
      <div className="p-5">
        <SectionHead title="Programs & payments" subtitle="Full enrollment history" />
      </div>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-slate-500">No programs yet.</p>
      ) : (
        <DataTable>
          <DataTableHead>
            {['Program', 'Batch', 'Status', 'Amount', 'Date'].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {items.map((item) => (
              <DataTableRow key={`${item.program}-${item.batch}`}>
                <DataTableCell className="font-semibold text-slate-800">{item.program}</DataTableCell>
                <DataTableCell>{item.batch}</DataTableCell>
                <DataTableCell className="font-semibold">{item.status}</DataTableCell>
                <DataTableCell className="font-bold tabular-nums">{item.amount}</DataTableCell>
                <DataTableCell>{item.date}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </Card>
  );
}
