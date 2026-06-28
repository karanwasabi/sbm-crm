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
import { attributionFormLabel, attributionSourceLabel } from '@/lib/lead-attribution';
import type { LeadAttribution, ProgramHistoryItem } from '@/types/crm';

type ProgramHistoryProps = {
  items: ProgramHistoryItem[];
  interest?: string;
  batch?: string;
  attribution?: LeadAttribution | null;
};

function label(value: string | null | undefined) {
  return value && value.trim() ? value : '—';
}

export function ProgramHistory({ items, interest, batch, attribution }: ProgramHistoryProps) {
  const showSummary = Boolean(interest?.trim() || batch?.trim() || attribution);
  const formLabel = attribution ? attributionFormLabel(attribution) : null;

  return (
    <Card padding="none" className="w-full">
      <div className="p-5">
        <SectionHead title="Programs & payments" subtitle="Interest, source, and enrollment history" />
        {showSummary ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Program interest</dt>
              <dd className="font-semibold text-slate-800">{label(interest)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Batch</dt>
              <dd className="font-semibold text-slate-800">{label(batch)}</dd>
            </div>
            {attribution ? (
              <>
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-semibold text-slate-800">{attributionSourceLabel(attribution)}</dd>
                </div>
                {formLabel ? (
                  <div>
                    <dt className="text-slate-500">Form</dt>
                    <dd className="font-semibold text-slate-800">{formLabel}</dd>
                  </div>
                ) : attribution.campaign ? (
                  <div>
                    <dt className="text-slate-500">Campaign</dt>
                    <dd className="font-semibold text-slate-800">{attribution.campaign}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-slate-500">No enrollments yet.</p>
      ) : (
        <DataTable>
          <DataTableHead>
            {['Program', 'Batch', 'Status', 'Amount', 'Promo', 'Start date'].map((h) => (
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
                <DataTableCell className="font-semibold text-slate-700">{item.promoCode ?? '—'}</DataTableCell>
                <DataTableCell>{item.date}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </Card>
  );
}
