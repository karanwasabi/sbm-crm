import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionHeadProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
};

export function SectionHead({ title, subtitle, right, className }: SectionHeadProps) {
  return (
    <div className={cn('mb-3.5 flex items-end justify-between', className)}>
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
