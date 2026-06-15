import { CapacityStrip } from '@/components/crm/capacity-strip';
import { CohortCalendar } from '@/components/crm/cohort-calendar';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { CohortCapacity } from '@/types/crm';

type CalendarDay = {
  day: number;
  label?: string;
  events: number;
};

type ProgramsViewProps = {
  cohorts: CohortCapacity[];
  calendarMonth: string;
  calendarDays: CalendarDay[];
};

export function ProgramsView({ cohorts, calendarMonth, calendarDays }: ProgramsViewProps) {
  return (
    <CrmPageLayout>
      <CapacityStrip cohorts={cohorts} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CohortCalendar days={calendarDays} month={calendarMonth} />
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
    </CrmPageLayout>
  );
}
