import { KpiCard } from '@/components/crm/kpi-card';
import { RenewalActionCard } from '@/components/crm/renewal-action-card';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { MOCK_RENEWAL_ACTIONS, MOCK_RENEWAL_KPIS, MOCK_RENEWAL_ROWS } from '@/lib/mock/renewals';

const statusTone = {
  due: 'warn' as const,
  achieved: 'success' as const,
  missed: 'danger' as const,
};

export function RenewalsView() {
  return (
    <CrmPageLayout>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_RENEWAL_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} trend={kpi.trend} accent={kpi.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {MOCK_RENEWAL_ACTIONS.map((action) => (
          <RenewalActionCard key={action.id} action={action} />
        ))}
      </div>

      <Card padding="none">
        <div className="p-5">
          <SectionHead title="Renewals pipeline" subtitle="Due · Achieved · Missed" />
        </div>
        <DataTable>
          <DataTableHead>
            {['Name', 'Program', 'Due date', 'Amount', 'Status'].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {MOCK_RENEWAL_ROWS.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell className="font-semibold text-slate-800">{row.name}</DataTableCell>
                <DataTableCell>{row.program}</DataTableCell>
                <DataTableCell>{row.dueDate}</DataTableCell>
                <DataTableCell className="font-bold tabular-nums">{row.amount}</DataTableCell>
                <DataTableCell>
                  <Pill tone={statusTone[row.status]}>{row.status}</Pill>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </Card>
    </CrmPageLayout>
  );
}
