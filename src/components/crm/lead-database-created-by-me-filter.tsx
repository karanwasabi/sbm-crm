'use client';

import Link from 'next/link';
import { UserCheck } from 'lucide-react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { cn } from '@/lib/cn';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabaseCreatedByMeFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseCreatedByMeFilter({ filters }: LeadDatabaseCreatedByMeFilterProps) {
  const isActive = filters.createdByMe;

  return (
    <Link
      href={buildLeadDatabaseHref(filters, { createdByMe: !isActive })}
      className={cn(filterPopoverTriggerClass(isActive), 'no-underline')}
      aria-pressed={isActive}
    >
      <UserCheck className="h-3.5 w-3.5" />
      Created by me
    </Link>
  );
}
