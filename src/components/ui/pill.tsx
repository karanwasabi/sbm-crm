import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PillTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'deep' | 'paid' | 'organic' | 'offline';

type PillProps = {
  children: ReactNode;
  tone?: PillTone;
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<PillTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-[#EEF0FF] text-brand',
  success: 'bg-[#DCFCE7] text-success-press',
  warn: 'bg-[#FEF3C7] text-[#92400E]',
  danger: 'bg-[#FEE2E5] text-danger-press',
  deep: 'bg-[#EDE9FE] text-brand-deep',
  paid: 'bg-[#EEF0FF] text-brand',
  organic: 'bg-[#DCFCE7] text-success-press',
  offline: 'bg-[#FEF3C7] text-[#92400E]',
};

export function Pill({ children, tone = 'neutral', icon, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase',
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
