import { cn } from '@/lib/cn';
import {
  DashboardChartBody,
  DashboardChartCard,
  DashboardChartHeader,
} from '@/components/crm/charts/dashboard-chart-card';

export type CategoricalBarItem = {
  id: string;
  label: string;
  count: number;
};

type CategoricalBarChartProps = {
  title: string;
  items: CategoricalBarItem[];
  emptyLabel?: string;
  className?: string;
  colorful?: boolean;
};

const BAR_COLORS = [
  'bg-brand',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-motivation',
] as const;

export function CategoricalBarChart({
  title,
  items,
  emptyLabel = 'No responses yet.',
  className,
  colorful = false,
}: CategoricalBarChartProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (items.length === 0 || total === 0) {
    return (
      <DashboardChartCard className={cn(className, colorful && 'border-slate-100 bg-white/90 shadow-sm')}>
        <DashboardChartHeader title={title} metric="0" />
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </DashboardChartCard>
    );
  }

  const maxValue = Math.max(...items.map((item) => item.count), 0);

  return (
    <DashboardChartCard className={cn(className, colorful && 'border-slate-100 bg-white/95 shadow-sm')}>
      <DashboardChartHeader title={title} metric={total.toLocaleString('en-IN')} />
      <DashboardChartBody>
        <div className="flex flex-col gap-2.5">
          {items.map((item, index) => {
            const widthPct = maxValue > 0 ? Math.max((item.count / maxValue) * 100, item.count > 0 ? 4 : 0) : 0;
            const barColor = colorful ? BAR_COLORS[index % BAR_COLORS.length] : 'bg-brand';
            return (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-700" title={item.label}>
                    {item.label}
                  </p>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100/90">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width]',
                        item.count > 0 ? barColor : 'bg-transparent'
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
                <p className="text-right text-xs font-extrabold text-slate-800 tabular-nums">
                  {item.count.toLocaleString('en-IN')}
                </p>
              </div>
            );
          })}
        </div>
      </DashboardChartBody>
    </DashboardChartCard>
  );
}
