import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CrmPageLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function CrmPageLayout({ children, className }: CrmPageLayoutProps) {
  return <div className={cn('flex flex-col gap-4 px-4 py-4 pb-8 lg:px-6 lg:py-5 lg:pb-9', className)}>{children}</div>;
}
