'use client';

import Link from 'next/link';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { buildLeadDatabaseHref, MARKETING_FILTER_OPTIONS, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { leadSourceLabel } from '@/lib/lead-sources';
import { tagSlugToLabel } from '@/lib/lead-tags';

type LeadDatabaseActiveFiltersProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseActiveFilters({ filters }: LeadDatabaseActiveFiltersProps) {
  const chips: Array<{ key: string; label: string; value: string; href: string }> = [];

  if (filters.q) {
    chips.push({
      key: 'q',
      label: 'Search',
      value: filters.q,
      href: buildLeadDatabaseHref(filters, { q: '' }),
    });
  }
  if (filters.marketing !== 'all') {
    const label =
      MARKETING_FILTER_OPTIONS.find((option) => option.id === filters.marketing)?.label ?? filters.marketing;
    chips.push({
      key: 'marketing',
      label: 'Marketing',
      value: label,
      href: buildLeadDatabaseHref(filters, { marketing: 'all' }),
    });
  }
  filters.tags.forEach((tag) => {
    chips.push({
      key: `tag-${tag}`,
      label: 'Tag',
      value: tagSlugToLabel(tag),
      href: buildLeadDatabaseHref(filters, { tags: filters.tags.filter((item) => item !== tag) }),
    });
  });
  filters.programs.forEach((program) => {
    chips.push({
      key: `program-${program}`,
      label: 'Program',
      value: program,
      href: buildLeadDatabaseHref(filters, { programs: filters.programs.filter((item) => item !== program) }),
    });
  });
  filters.batches.forEach((batch) => {
    chips.push({
      key: `batch-${batch}`,
      label: 'Batch',
      value: batch,
      href: buildLeadDatabaseHref(filters, { batches: filters.batches.filter((item) => item !== batch) }),
    });
  });
  filters.geography.forEach((geo) => {
    chips.push({
      key: `geo-${geo}`,
      label: 'Geography',
      value: geo,
      href: buildLeadDatabaseHref(filters, { geography: filters.geography.filter((item) => item !== geo) }),
    });
  });
  filters.sources.forEach((source) => {
    chips.push({
      key: `source-${source}`,
      label: 'Source',
      value: leadSourceLabel(source) || source,
      href: buildLeadDatabaseHref(filters, { sources: filters.sources.filter((item) => item !== source) }),
    });
  });
  if (filters.addedFrom || filters.addedTo) {
    chips.push({
      key: 'added',
      label: 'Added',
      value: [filters.addedFrom, filters.addedTo].filter(Boolean).join(' → '),
      href: buildLeadDatabaseHref(filters, { addedFrom: '', addedTo: '' }),
    });
  }
  if (filters.updatedFrom || filters.updatedTo) {
    chips.push({
      key: 'updated',
      label: 'Updated',
      value: [filters.updatedFrom, filters.updatedTo].filter(Boolean).join(' → '),
      href: buildLeadDatabaseHref(filters, { updatedFrom: '', updatedTo: '' }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/15 bg-brand/5 px-3 py-2">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} className="no-underline">
          <ActiveFilterTag label={chip.label} value={chip.value} onDismiss={() => undefined} />
        </Link>
      ))}
      <Link
        href={buildLeadDatabaseHref(filters, {
          q: '',
          marketing: 'all',
          tags: [],
          programs: [],
          batches: [],
          geography: [],
          sources: [],
          addedFrom: '',
          addedTo: '',
          updatedFrom: '',
          updatedTo: '',
          sort: 'created_at',
          order: 'desc',
        })}
        className="text-xs font-semibold text-brand no-underline"
      >
        Clear all
      </Link>
    </div>
  );
}
