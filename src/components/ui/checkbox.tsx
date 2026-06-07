'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
  tabIndex?: number;
};

export function Checkbox({ checked, onChange, label, className, tabIndex }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        tabIndex={tabIndex}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all duration-120',
          checked ? 'border-brand bg-brand' : 'border-slate-300 bg-white'
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>
      {label && <span className="text-[12.5px] leading-snug font-medium text-slate-700">{label}</span>}
    </label>
  );
}
