'use client';

import { type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? <Label className="pl-0.5 text-[12.5px] font-semibold text-slate-700">{label}</Label> : null}
      {children}
      {hint && !error ? <p className="pl-0.5 text-[11.5px] font-medium text-muted-foreground">{hint}</p> : null}
      {error ? <p className="pl-0.5 text-[11.5px] font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
