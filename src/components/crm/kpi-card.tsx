import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: string;
  icon?: LucideIcon;
  spark?: number[];
};

export function KpiCard({ label, value, sub, trend, accent = '#5C65CF', icon: Icon, spark = [] }: KpiCardProps) {
  const w = 100;
  const h = 26;
  const path =
    spark.length > 1
      ? spark
          .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * w) / (spark.length - 1)},${h - (v / 10) * (h - 4) - 2}`)
          .join(' ')
      : '';

  const trendPositive = trend && !trend.startsWith('-');

  return (
    <Card padding="sm" className="flex min-h-[130px] flex-col gap-2.5 p-[18px]">
      <div className="flex items-center justify-between">
        {Icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${accent}20`, color: accent }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
        {trend && (
          <span className={cn('text-[11px] font-bold', trendPositive ? 'text-success-press' : 'text-danger-press')}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-[26px] leading-none font-extrabold tracking-tight text-slate-800">{value}</div>
      <div className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">{label}</div>
      {sub && <div className="text-[11.5px] font-medium text-slate-500">{sub}</div>}
      {spark.length > 1 && (
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-auto h-[26px] w-full">
          <path d={path} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Card>
  );
}
