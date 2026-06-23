import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { formatFunnelDrop, formatFunnelShare } from '@/lib/dashboard-display';
import type { FunnelStep } from '@/types/crm';

type FunnelChartProps = {
  steps: FunnelStep[];
  title?: string;
  subtitle?: string;
};

export function FunnelChart({
  steps,
  title = 'Lifecycle funnel',
  subtitle = 'All contacts by stage',
}: FunnelChartProps) {
  const max = Math.max(1, ...steps.map((step) => step.count));

  if (steps.length === 0) {
    return (
      <Card>
        <SectionHead title={title} subtitle={subtitle} />
        <p className="px-5 pb-5 text-sm text-slate-500">No leads in CRM yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHead title={title} subtitle={subtitle} />
      <div className="flex flex-col gap-2.5">
        {steps.map((step, index) => {
          const share = step.count / max;
          const barWidth = step.count > 0 ? Math.max(share * 100, 3) : 0;
          const shareLabel = formatFunnelShare(step.count, max);
          const showLabelInside = share >= 0.18;
          const dropLabel = index === 0 ? null : formatFunnelDrop(step.count, steps[index - 1]?.count ?? 0);

          return (
            <div key={step.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">{step.label}</span>
                <div className="flex shrink-0 items-baseline gap-2">
                  {dropLabel ? <span className="text-[10px] font-semibold text-slate-400">{dropLabel}</span> : null}
                  {!showLabelInside ? (
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">{shareLabel}</span>
                  ) : null}
                  <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="relative h-[22px] overflow-hidden rounded-full bg-slate-100">
                {step.count > 0 ? (
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded-full border-b-[3px] border-black/14"
                    style={{ width: `${barWidth}%`, background: step.color }}
                  >
                    {showLabelInside ? (
                      <span className="flex h-full items-center pl-3 text-[11px] font-bold tracking-wide text-white">
                        {shareLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
