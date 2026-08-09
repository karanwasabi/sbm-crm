import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PerformanceSectionHeaderProps = {
  title: string;
  subtitle?: string;
  search?: ReactNode;
  controls?: ReactNode;
  className?: string;
};

export function PerformanceSectionHeader({
  title,
  subtitle,
  search,
  controls,
  className,
}: PerformanceSectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-slate-800">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {search}
          {controls}
        </div>
      </div>
    </div>
  );
}
