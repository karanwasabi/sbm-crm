'use client';

import Link from 'next/link';
import { Copy } from 'lucide-react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { cn } from '@/lib/cn';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabasePhoneDuplicatesFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabasePhoneDuplicatesFilter({ filters }: LeadDatabasePhoneDuplicatesFilterProps) {
  const isActive = filters.phoneDuplicates;

  return (
    <Link
      href={buildLeadDatabaseHref(filters, { phoneDuplicates: !isActive })}
      className={cn(filterPopoverTriggerClass(isActive), 'no-underline')}
      aria-pressed={isActive}
    >
      <Copy className="h-3.5 w-3.5" />
      Phone dupes
    </Link>
  );
}
