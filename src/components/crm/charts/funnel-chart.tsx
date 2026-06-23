import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { cn } from '@/lib/cn';
import { formatFunnelShare } from '@/lib/dashboard-display';
import type { FunnelStep } from '@/types/crm';

type FunnelChartProps = {
  steps: FunnelStep[];
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

export function FunnelChart({
  steps,
  title = 'Lifecycle funnel',
  subtitle = 'All contacts by stage',
  className,
  compact = false,
}: FunnelChartProps) {
  const max = Math.max(1, ...steps.map((step) => step.count));

  if (steps.length === 0) {
    return (
      <Card className={cn('h-full', className)}>
        <SectionHead title={title} subtitle={subtitle} />
        <p className="text-sm text-slate-500">No leads in CRM yet.</p>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <SectionHead title={title} subtitle={subtitle} className={compact ? 'mb-2.5' : undefined} />
      <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2.5')}>
        {steps.map((step) => {
          const share = step.count / max;
          const barWidth = step.count > 0 ? Math.max(share * 100, 3) : 0;
          const shareLabel = formatFunnelShare(step.count, max);
          const showShareInside = step.count > 0 && share >= 0.18;
          const showShareOutside = step.count > 0 && !showShareInside;

          return (
            <div key={step.label}>
              <div className={cn('mb-1 flex items-baseline justify-between gap-2', compact && 'mb-0.5')}>
                <span className={cn('font-bold text-slate-700', compact ? 'text-[11px]' : 'text-xs')}>
                  {step.label}
                </span>
                <div className="flex shrink-0 items-baseline gap-1.5">
                  {showShareOutside ? (
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">{shareLabel}</span>
                  ) : null}
                  <span className={cn('font-extrabold text-slate-800 tabular-nums', compact ? 'text-xs' : 'text-sm')}>
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div
                className={cn('relative overflow-hidden rounded-full bg-slate-100', compact ? 'h-[18px]' : 'h-[22px]')}
              >
                {step.count > 0 ? (
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded-full border-b-[3px] border-black/14"
                    style={{ width: `${barWidth}%`, background: step.color }}
                  >
                    {showShareInside ? (
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
