import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export type KpiStripItem = {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: string;
  icon?: LucideIcon;
};

type KpiStripProps = {
  items: KpiStripItem[];
};

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        {items.map((kpi) => {
          const Icon = kpi.icon;
          const accent = kpi.accent ?? '#5C65CF';
          const trendUp = kpi.trend?.startsWith('+');
          const trendDown = kpi.trend?.startsWith('-');

          return (
            <div
              key={kpi.label}
              className="flex min-h-30 flex-col items-center justify-center gap-2 px-5 py-5 text-center sm:px-6"
            >
              {Icon ? (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accent}18`, color: accent }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              ) : null}

              <p className="max-w-44 text-[10px] leading-snug font-bold tracking-[0.12em] text-slate-500 uppercase">
                {kpi.label}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="text-2xl leading-none font-extrabold tracking-tight text-slate-800 tabular-nums">
                  {kpi.value}
                </p>
                {kpi.trend ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      trendUp && 'bg-success-press/10 text-success-press',
                      trendDown && 'bg-danger-press/10 text-danger-press',
                      !trendUp && !trendDown && 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {kpi.trend}
                  </span>
                ) : null}
              </div>

              {kpi.sub ? (
                <p className="max-w-48 text-[11px] leading-snug font-medium text-slate-500">{kpi.sub}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
