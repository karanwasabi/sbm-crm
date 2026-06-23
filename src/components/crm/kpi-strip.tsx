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
  spark?: number[];
};

type KpiStripProps = {
  items: KpiStripItem[];
};

function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  if (values.length < 2) {
    return null;
  }

  const w = 100;
  const h = 24;
  const max = Math.max(...values, 1);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * w) / (values.length - 1)},${h - (v / max) * (h - 4) - 2}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-6 w-full" aria-hidden>
      <path d={path} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
            <div key={kpi.label} className="flex min-h-[108px] flex-col justify-between px-4 py-3.5 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {Icon ? (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${accent}18`, color: accent }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  ) : null}
                  <p className="text-[10px] leading-tight font-bold tracking-[0.12em] text-slate-500 uppercase">
                    {kpi.label}
                  </p>
                </div>
                {kpi.trend ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      trendUp && 'bg-success-press/10 text-success-press',
                      trendDown && 'bg-danger-press/10 text-danger-press',
                      !trendUp && !trendDown && 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {kpi.trend}
                  </span>
                ) : null}
              </div>

              <div className="mt-2">
                <p className="text-[22px] leading-none font-extrabold tracking-tight text-slate-800 tabular-nums">
                  {kpi.value}
                </p>
                {kpi.sub ? <p className="mt-1 text-[11px] leading-snug font-medium text-slate-500">{kpi.sub}</p> : null}
                {kpi.spark && kpi.spark.length > 1 ? <Sparkline values={kpi.spark} accent={accent} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
