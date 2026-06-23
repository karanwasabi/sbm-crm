import type { ReactNode } from 'react';
import { Skeleton } from '@/components/loading/skeleton';
import { cn } from '@/lib/cn';

type CardSkeletonProps = {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  className?: string;
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-[22px]',
};

export function CardSkeleton({ children, padding = 'md', className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[22px] border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeadSkeleton({ className }: { className?: string }) {
  return (
    <div className={className ?? 'mb-4'}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-1.5 h-3 w-56" />
    </div>
  );
}
