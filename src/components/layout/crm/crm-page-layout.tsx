import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CrmPageLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function CrmPageLayout({ children, className }: CrmPageLayoutProps) {
  return <div className={cn('flex flex-col gap-4 px-6 py-5 pb-9', className)}>{children}</div>;
}
