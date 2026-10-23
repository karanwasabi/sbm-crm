'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { cn } from '@/lib/cn';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabaseUnredeemedStarsFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseUnredeemedStarsFilter({ filters }: LeadDatabaseUnredeemedStarsFilterProps) {
  const isActive = filters.starsUnredeemed;

  return (
    <Link
      href={buildLeadDatabaseHref(filters, { starsUnredeemed: !isActive })}
      className={cn(filterPopoverTriggerClass(isActive), 'no-underline')}
      aria-pressed={isActive}
      title="Members who still have stars and have never redeemed them"
    >
      <Star className="h-3.5 w-3.5" />
      Unredeemed stars
    </Link>
  );
}
