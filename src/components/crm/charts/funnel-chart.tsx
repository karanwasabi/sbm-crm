import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { FunnelStep } from '@/types/crm';

type FunnelChartProps = {
  steps: FunnelStep[];
  title?: string;
  subtitle?: string;
};

export function FunnelChart({
  steps,
  title = 'Funnel · last 30 days',
  subtitle = 'Drop-off across inquiry → completed',
}: FunnelChartProps) {
  const max = steps[0]?.count ?? 1;

  return (
    <Card>
      <SectionHead
        title={title}
        subtitle={subtitle}
        right={
          <Button variant="light" size="sm">
            Switch cohort
          </Button>
        }
      />
      <div className="flex flex-col gap-2.5">
        {steps.map((step, index) => {
          const pct = step.count / max;
          const dropFromPrev = index === 0 ? null : Math.round((1 - step.count / (steps[index - 1]?.count ?? 1)) * 100);

          return (
            <div key={step.label}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-700">{step.label}</span>
                <div className="flex items-baseline gap-2">
                  {dropFromPrev !== null && (
                    <span className="text-[10px] font-semibold text-slate-400">↓ {dropFromPrev}%</span>
                  )}
                  <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="relative h-[22px] overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute top-0 bottom-0 left-0 flex items-center rounded-full border-b-[3px] border-black/14 pl-3.5 text-[11px] font-bold tracking-wide text-white"
                  style={{ width: `${pct * 100}%`, background: step.color }}
                >
                  {Math.round(pct * 100)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
