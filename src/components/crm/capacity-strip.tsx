import { Card } from '@/components/ui/card';
import type { CohortCapacity } from '@/types/crm';

type CapacityStripProps = {
  cohorts: CohortCapacity[];
};

export function CapacityStrip({ cohorts }: CapacityStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {cohorts.map((cohort) => {
        const pct = Math.round((cohort.enrolled / cohort.cap) * 100);
        return (
          <Card key={cohort.name} padding="sm" className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-800">{cohort.name}</span>
              {cohort.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: `${cohort.color}20`, color: cohort.color }}
                >
                  {cohort.badge}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500">{cohort.week}</div>
            <div className="mt-2 text-lg font-extrabold text-slate-800">
              {cohort.enrolled}/{cohort.cap}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cohort.color }} />
            </div>
            {cohort.waitlist > 0 && (
              <div className="mt-1.5 text-[11px] font-semibold text-motivation">{cohort.waitlist} on waitlist</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
