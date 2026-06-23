import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { cn } from '@/lib/cn';
import { chartNiceMax, chartYAxisTicks, formatChartThousands } from '@/lib/dashboard-display';
import type { RevenueWeek } from '@/types/crm';

const CHART_HEIGHT = 132;

type BarChartProps = {
  data: RevenueWeek[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export function BarChart({
  data,
  title = 'Weekly revenue',
  subtitle = 'Last 8 weeks · paid checkouts and subscriptions',
  className,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <Card className={cn('h-full', className)}>
        <SectionHead title={title} subtitle={subtitle} />
        <p className="text-sm text-slate-500">No revenue recorded yet.</p>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((row) => row.revenue), 0);
  const yMax = chartNiceMax(maxValue);
  const yTicks = chartYAxisTicks(maxValue);
  const totalThousands = data.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <Card className={cn('h-full', className)}>
      <SectionHead
        title={title}
        subtitle={subtitle}
        right={
          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            ₹{formatChartThousands(totalThousands)}k total
          </span>
        }
      />
      <div className="flex gap-3 pb-2">
        <div className="flex shrink-0 flex-col justify-between text-right" style={{ height: CHART_HEIGHT }}>
          {[...yTicks].reverse().map((tick) => (
            <span key={tick} className="text-[10px] leading-none font-medium text-slate-400 tabular-nums">
              {formatChartThousands(tick)}k
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

            <div className="relative z-10 flex h-full items-end justify-between gap-1.5">
              {data.map((row) => {
                const barHeight = yMax > 0 && row.revenue > 0 ? Math.max((row.revenue / yMax) * CHART_HEIGHT, 6) : 0;

                return (
                  <div key={row.week} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    {row.revenue > 0 ? (
                      <span className="text-[10px] leading-none font-semibold text-slate-700 tabular-nums">
                        ₹{formatChartThousands(row.revenue)}k
                      </span>
                    ) : (
                      <span className="text-[10px] leading-none font-medium text-slate-300">—</span>
                    )}
                    <div
                      className="w-full max-w-9 rounded-t-md bg-brand"
                      style={{ height: barHeight }}
                      title={`${row.week}: ₹${formatChartThousands(row.revenue)}k`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex justify-between gap-1.5 border-t border-slate-100 pt-2">
            {data.map((row) => (
              <span
                key={row.week}
                className="min-w-0 flex-1 truncate text-center text-[10px] font-semibold text-slate-500"
                title={row.week}
              >
                {row.week}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400">Amounts in ₹ thousands (₹1k = ₹1,000)</p>
    </Card>
  );
}
