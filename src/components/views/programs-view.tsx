import { AttendanceTable } from '@/components/crm/attendance-table';
import { CapacityStrip } from '@/components/crm/capacity-strip';
import { CohortCalendar } from '@/components/crm/cohort-calendar';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { MOCK_ATTENDANCE, MOCK_CALENDAR_DAYS, MOCK_COHORT_CAPACITY } from '@/lib/mock/cohorts';

export function ProgramsView() {
  return (
    <CrmPageLayout>
      <CapacityStrip cohorts={MOCK_COHORT_CAPACITY} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CohortCalendar days={MOCK_CALENDAR_DAYS} />
        <Card>
          <SectionHead title="Transfer workflow" subtitle="Move contact between cohorts" />
          <p className="mb-4 text-[13px] text-slate-600">
            Select a contact from Lead Database, then assign them to a new cohort. Capacity checks run automatically.
          </p>
          <Button variant="primary" size="sm">
            Start transfer
          </Button>
        </Card>
      </div>

      <AttendanceTable rows={MOCK_ATTENDANCE} />
    </CrmPageLayout>
  );
}
