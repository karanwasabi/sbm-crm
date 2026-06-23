import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type DataTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DataTable({ children, className, tableClassName }: DataTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('w-full border-collapse', tableClassName)}>{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-canvas-cool">{children}</tr>
    </thead>
  );
}

export function DataTableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-left text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase',
        className
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn('border-t border-slate-100', onClick && 'cursor-pointer hover:bg-canvas-cool/50', className)}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'link' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3 text-[13px] text-slate-700', className)}>
      {children}
    </td>
  );
}
