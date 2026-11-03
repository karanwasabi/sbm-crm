import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Renders `mobile` below `lg` and `desktop` at `lg+`. Desktop layout stays untouched. */
export function ResponsiveList({
  mobile,
  desktop,
  className,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>
    </div>
  );
}
