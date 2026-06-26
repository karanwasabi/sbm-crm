import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export const DASHBOARD_CHART_MIN_HEIGHT = 'min-h-[272px]';

type DashboardChartCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardChartCard({ children, className }: DashboardChartCardProps) {
  return <Card className={cn('flex h-full flex-col', DASHBOARD_CHART_MIN_HEIGHT, className)}>{children}</Card>;
}

type DashboardChartHeaderProps = {
  title: string;
  metric: ReactNode;
  className?: string;
};

export function DashboardChartHeader({ title, metric, className }: DashboardChartHeaderProps) {
  return (
    <div className={cn('mb-3 flex shrink-0 items-start justify-between gap-3', className)}>
      <h2 className="text-base font-bold tracking-tight text-slate-800">{title}</h2>
      <div className="shrink-0 text-right text-sm font-extrabold text-slate-800 tabular-nums">{metric}</div>
    </div>
  );
}

type DashboardChartBodyProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardChartBody({ children, className }: DashboardChartBodyProps) {
  return <div className={cn('flex min-h-[168px] flex-1 flex-col justify-center', className)}>{children}</div>;
}
