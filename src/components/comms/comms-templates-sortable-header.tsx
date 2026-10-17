'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  buildCommsTemplatesHref,
  nextCommsTemplateSort,
  parseCommsTemplateSort,
  type CommsTemplateFilters,
  type CommsTemplateSortColumn,
} from '@/lib/comms-templates-query';

type CommsTemplatesSortableHeaderProps = {
  label: string;
  column: CommsTemplateSortColumn;
  filters: CommsTemplateFilters;
};

export function CommsTemplatesSortableHeader({ label, column, filters }: CommsTemplatesSortableHeaderProps) {
  const active = parseCommsTemplateSort(filters.sort);
  const isActive = active.column === column;
  const Icon = !isActive ? ArrowUpDown : active.order === 'asc' ? ArrowUp : ArrowDown;
  const href = buildCommsTemplatesHref(filters, { sort: nextCommsTemplateSort(filters.sort, column) });

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 no-underline transition-colors hover:text-brand',
        isActive ? 'text-brand' : 'text-slate-500'
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </Link>
  );
}

export function formatCommsTemplateDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
