import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="pl-1 text-[12.5px] font-semibold text-slate-700">{label}</span>}
      {children}
      {hint && !error && <span className="pl-1 text-[11.5px] font-medium text-slate-500">{hint}</span>}
      {error && <span className="pl-1 text-[11.5px] font-semibold text-danger-press">{error}</span>}
    </label>
  );
}
