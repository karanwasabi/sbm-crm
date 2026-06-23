import { CardSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { cn } from '@/lib/cn';

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
};

export function TableSkeleton({ columns = 6, rows = 8, className, showHeader = true }: TableSkeletonProps) {
  return (
    <CardSkeleton padding="none" className={cn('overflow-hidden', className)}>
      {showHeader ? (
        <div className="flex gap-4 border-b border-slate-100 px-5 py-3">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`head-${index}`} className="h-3 flex-1" />
          ))}
        </div>
      ) : null}
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn('h-3.5 flex-1', colIndex === 0 && 'max-w-[120px]')}
              />
            ))}
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}
