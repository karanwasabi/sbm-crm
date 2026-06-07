'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  showDot?: boolean;
};

export function IconButton({ children, showDot, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white p-2.25 text-slate-600 transition-colors hover:bg-slate-50',
        className
      )}
      {...props}
    >
      {children}
      {showDot && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />}
    </button>
  );
}
