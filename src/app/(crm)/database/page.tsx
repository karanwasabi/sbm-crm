import { Suspense } from 'react';
import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { LeadDatabaseTableFallback } from '@/components/loading/lead-database-table-fallback';
import { buildLeadDatabaseHref, parseLeadDatabaseFilters } from '@/lib/lead-database-url';
import { getLeadFilterOptions, getLeadSummary, listTagSuggestions } from '@/utils/api';
import type { LeadFilterOptions, LeadSummary } from '@/types/crm';
import { LeadDatabaseTableLoader } from './lead-database-table-loader';

const EMPTY_SUMMARY: LeadSummary = {
  total: 0,
  byStage: {
    inquiry: 0,
    engaged: 0,
    registered: 0,
    newbie: 0,
    member: 0,
    grace: 0,
    lapsed: 0,
    lost: 0,
  },
};

const EMPTY_FILTER_OPTIONS: LeadFilterOptions = {
  programs: [],
  batches: [],
  geography: [],
};

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseLeadDatabaseFilters(params);
  const suspenseKey = buildLeadDatabaseHref(filters);

  let summary = EMPTY_SUMMARY;
  let filterOptions = EMPTY_FILTER_OPTIONS;
  let tagSuggestions: import('@/types/crm').TagSuggestion[] = [];

  try {
    [summary, filterOptions] = await Promise.all([getLeadSummary(), getLeadFilterOptions()]);
  } catch {
    summary = EMPTY_SUMMARY;
    filterOptions = EMPTY_FILTER_OPTIONS;
  }

  try {
    tagSuggestions = await listTagSuggestions();
  } catch {
    tagSuggestions = [];
  }

  return (
    <LeadDatabaseView filters={filters} summary={summary} filterOptions={filterOptions} tagSuggestions={tagSuggestions}>
      <Suspense key={suspenseKey} fallback={<LeadDatabaseTableFallback />}>
        <LeadDatabaseTableLoader filters={filters} summary={summary} />
      </Suspense>
    </LeadDatabaseView>
  );
}
