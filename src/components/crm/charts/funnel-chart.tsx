import {
  DashboardChartBody,
  DashboardChartCard,
  DashboardChartHeader,
} from '@/components/crm/charts/dashboard-chart-card';
import { cn } from '@/lib/cn';
import { formatFunnelShare } from '@/lib/dashboard-display';
import type { FunnelStep } from '@/types/crm';

type FunnelChartProps = {
  steps: FunnelStep[];
  title?: string;
  className?: string;
};

const LIFECYCLE_LEGEND_COLUMNS = [
  ['inquiry', 'engaged', 'registered', 'newbie'],
  ['member', 'paused', 'grace', 'lapsed', 'transferred', 'lost'],
] as const;

function LifecycleStageCell({ step, total }: { step: FunnelStep; total: number }) {
  const shareLabel = formatFunnelShare(step.count, Math.max(total, 1));
  const isEmpty = step.count === 0;

  return (
    <div
      className={cn(
        'grid grid-cols-[2.5rem_minmax(0,1fr)_3.25rem] items-center gap-x-2 overflow-hidden rounded-lg border border-slate-100/90 bg-white px-2 py-1.5',
        isEmpty && 'opacity-60'
      )}
      title={`${step.label}: ${step.count.toLocaleString()} (${shareLabel})`}
    >
      <span
        className={cn(
          'pr-1 text-right text-[10px] font-semibold tabular-nums',
          isEmpty ? 'text-slate-300' : 'text-slate-500'
        )}
      >
        {shareLabel}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="h-3.5 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: step.color }} aria-hidden />
        <span className={cn('truncate text-[10px] font-semibold', isEmpty ? 'text-slate-400' : 'text-slate-700')}>
          {step.label}
        </span>
      </div>
      <span
        className={cn(
          'text-right text-[10px] font-extrabold tabular-nums',
          isEmpty ? 'text-slate-400' : 'text-slate-800'
        )}
      >
        {step.count.toLocaleString()}
      </span>
    </div>
  );
}

function LifecycleStageLegend({ steps, total }: { steps: FunnelStep[]; total: number }) {
  const stepsByStage = new Map(steps.map((step) => [step.stage, step]));

  return (
    <div className="grid grid-cols-2 gap-2">
      {LIFECYCLE_LEGEND_COLUMNS.map((columnStages, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-1">
          {columnStages.map((stage) => {
            const step = stepsByStage.get(stage);
            if (!step) {
              return null;
            }
            return <LifecycleStageCell key={step.stage} step={step} total={total} />;
          })}
        </div>
      ))}
    </div>
  );
}

export function FunnelChart({ steps, title = 'Lifecycle funnel', className }: FunnelChartProps) {
  const total = steps.reduce((sum, step) => sum + step.count, 0);

  if (steps.length === 0) {
    return (
      <DashboardChartCard className={className}>
        <DashboardChartHeader title={title} metric="0" />
        <p className="text-sm text-slate-500">No leads in CRM yet.</p>
      </DashboardChartCard>
    );
  }

  return (
    <DashboardChartCard className={className}>
      <DashboardChartHeader title={title} metric={total.toLocaleString()} />
      <DashboardChartBody>
        <div className="flex flex-col gap-2.5">
          <div
            className="flex h-5 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label="Lead distribution by lifecycle stage"
          >
            {steps.map((step) => {
              if (step.count === 0) {
                return null;
              }
              const width = (step.count / total) * 100;
              const shareLabel = formatFunnelShare(step.count, total);
              return (
                <div
                  key={step.stage}
                  className="h-full shrink-0 border-r border-white/25 last:border-r-0"
                  style={{ width: `${width}%`, background: step.color, minWidth: '3px' }}
                  title={`${step.label}: ${step.count.toLocaleString()} (${shareLabel})`}
                />
              );
            })}
          </div>
          <LifecycleStageLegend steps={steps} total={total} />
        </div>
      </DashboardChartBody>
    </DashboardChartCard>
  );
}
