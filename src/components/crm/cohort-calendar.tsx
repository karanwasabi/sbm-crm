import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';

type CalendarDay = {
  day: number;
  label?: string;
  events: number;
};

type CohortCalendarProps = {
  days: CalendarDay[];
  month?: string;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CohortCalendar({ days, month = 'May 2026' }: CohortCalendarProps) {
  return (
    <Card>
      <SectionHead title="Cohort calendar" subtitle={month} />
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold tracking-wide text-slate-400 uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.day}
            className={`min-h-[52px] rounded-xl border p-1.5 ${
              day.events > 0 ? 'border-brand/30 bg-[#EEF0FF]' : 'border-slate-100 bg-white'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-700">{day.day}</div>
            {day.label && <div className="mt-0.5 text-[8px] leading-tight font-semibold text-brand">{day.label}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}
