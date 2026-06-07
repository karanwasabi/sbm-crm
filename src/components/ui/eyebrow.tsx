import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  color?: 'default' | 'light' | 'muted';
};

export function Eyebrow({ children, className, color = 'default' }: EyebrowProps) {
  return (
    <div
      className={cn(
        'text-[10px] font-bold tracking-[0.16em] uppercase',
        color === 'light' ? 'text-white/85' : color === 'muted' ? 'text-slate-400' : 'text-slate-500',
        className
      )}
    >
      {children}
    </div>
  );
}
