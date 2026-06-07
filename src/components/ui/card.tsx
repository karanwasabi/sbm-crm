import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md';
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-[22px]',
};

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[22px] border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
