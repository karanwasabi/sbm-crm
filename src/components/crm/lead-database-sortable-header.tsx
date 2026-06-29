'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { buildLeadDatabaseHref, type LeadDatabaseFilters, type LeadDatabaseSort } from '@/lib/lead-database-url';
import { cn } from '@/lib/cn';

type SortableHeaderProps = {
  label: string;
  sortKey: LeadDatabaseSort;
  filters: LeadDatabaseFilters;
  className?: string;
};

export function SortableHeader({ label, sortKey, filters, className }: SortableHeaderProps) {
  const active = filters.sort === sortKey;
  const nextOrder = active && filters.order === 'desc' ? 'asc' : 'desc';
  const href = buildLeadDatabaseHref(filters, { sort: sortKey, order: nextOrder, page: 1 });

  const Icon = !active ? ArrowUpDown : filters.order === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 no-underline transition-colors hover:text-brand',
        active ? 'text-brand' : 'text-slate-600',
        className
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Link>
  );
}
