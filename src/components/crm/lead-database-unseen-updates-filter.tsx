'use client';

import Link from 'next/link';
import { BellRing } from 'lucide-react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { cn } from '@/lib/cn';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabaseUnseenUpdatesFilterProps = {
  filters: LeadDatabaseFilters;
  unseenCount: number;
};

export function LeadDatabaseUnseenUpdatesFilter({ filters, unseenCount }: LeadDatabaseUnseenUpdatesFilterProps) {
  const isActive = filters.hasUnseenSuggestions;
  const countLabel = unseenCount.toLocaleString('en-IN');

  return (
    <Link
      href={buildLeadDatabaseHref(filters, { hasUnseenSuggestions: !isActive })}
      className={cn(filterPopoverTriggerClass(isActive), 'no-underline')}
      aria-pressed={isActive}
    >
      <BellRing className="h-3.5 w-3.5" />
      Unseen updates ({countLabel})
    </Link>
  );
}
