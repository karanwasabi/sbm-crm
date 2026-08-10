import { cn } from '@/lib/cn';
import {
  REVENUE_WEEK_SLOTS,
  chartNiceMax,
  chartYAxisTicks,
  chooseChartRevenueUnit,
  formatChartRevenueLabel,
  formatChartRevenueValue,
} from '@/lib/dashboard-display';
import type { RevenueWeek } from '@/types/crm';
import {
  DashboardChartBody,
  DashboardChartCard,
  DashboardChartHeader,
} from '@/components/crm/charts/dashboard-chart-card';

const CHART_HEIGHT = 120;

type BarChartProps = {
  data: RevenueWeek[];
  title?: string;
  className?: string;
};

export function BarChart({ data, title = 'Weekly revenue', className }: BarChartProps) {
  if (data.length === 0) {
    return (
      <DashboardChartCard className={className}>
        <DashboardChartHeader title={title} metric="₹0" />
        <p className="text-sm text-slate-500">No revenue recorded yet.</p>
      </DashboardChartCard>
    );
  }

  const slots = data.slice(-REVENUE_WEEK_SLOTS);
  const maxValue = Math.max(...slots.map((row) => row.revenue), 0);
  const yMax = chartNiceMax(maxValue);
  const yTicks = chartYAxisTicks(maxValue);
  const totalThousands = slots.reduce((sum, row) => sum + row.revenue, 0);
  const unit = chooseChartRevenueUnit(maxValue);

  return (
    <DashboardChartCard className={className}>
      <DashboardChartHeader title={title} metric={formatChartRevenueLabel(totalThousands, unit)} />
      <DashboardChartBody>
        <div className="flex gap-2.5">
          <div className="flex shrink-0 flex-col justify-between text-right" style={{ height: CHART_HEIGHT }}>
            {[...yTicks].reverse().map((tick) => (
              <span key={tick} className="text-[10px] leading-none font-medium text-slate-400 tabular-nums">
                {formatChartRevenueValue(tick, unit)}
                {unit}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height: CHART_HEIGHT }}>
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {yTicks.map((tick) => (
                  <div key={tick} className="border-t border-dashed border-slate-100" />
                ))}
              </div>

              <div
                className="relative z-10 grid h-full items-end gap-1"
                style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
              >
                {slots.map((row) => {
                  const barHeight = yMax > 0 && row.revenue > 0 ? Math.max((row.revenue / yMax) * CHART_HEIGHT, 6) : 0;

                  return (
                    <div key={row.week} className="flex h-full flex-col items-center justify-end gap-1">
                      {row.revenue > 0 ? (
                        <span className="text-[10px] leading-none font-semibold text-slate-700 tabular-nums">
                          {formatChartRevenueLabel(row.revenue, unit)}
                        </span>
                      ) : (
                        <span className="text-[10px] leading-none font-medium text-slate-300">—</span>
                      )}
                      <div
                        className={cn('w-full max-w-10 rounded-t-md', row.revenue > 0 ? 'bg-brand' : 'bg-transparent')}
                        style={{ height: barHeight }}
                        title={`Week of ${row.week}: ${formatChartRevenueLabel(row.revenue, unit)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-2 grid gap-1 border-t border-slate-100 pt-2"
              style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
            >
              {slots.map((row) => (
                <span
                  key={row.week}
                  className="text-center text-[9px] leading-tight font-semibold text-slate-500"
                  title={`Week of ${row.week}`}
                >
                  {row.week}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DashboardChartBody>
    </DashboardChartCard>
  );
}
