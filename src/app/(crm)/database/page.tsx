import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { parseLeadDatabaseFilters } from '@/lib/lead-database-url';
import { getLeadFilterOptions, getLeadSummary, listLeads, listTagSuggestions } from '@/utils/api';
import type { LeadFilterOptions, LeadListResult, LeadSummary } from '@/types/crm';

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

const EMPTY_LIST: LeadListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,
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

  let listResult = EMPTY_LIST;
  let summary = EMPTY_SUMMARY;
  let filterOptions = EMPTY_FILTER_OPTIONS;
  let tagSuggestions: import('@/types/crm').TagSuggestion[] = [];
  let loadError: string | null = null;

  try {
    [listResult, summary, filterOptions] = await Promise.all([
      listLeads(filters),
      getLeadSummary(),
      getLeadFilterOptions(),
    ]);
  } catch (error) {
    listResult = EMPTY_LIST;
    summary = EMPTY_SUMMARY;
    filterOptions = EMPTY_FILTER_OPTIONS;
    loadError = error instanceof Error ? error.message : 'Failed to load leads.';
  }

  try {
    tagSuggestions = await listTagSuggestions();
  } catch {
    tagSuggestions = [];
  }

  return (
    <LeadDatabaseView
      listResult={listResult}
      summary={summary}
      filters={filters}
      filterOptions={filterOptions}
      loadError={loadError}
      tagSuggestions={tagSuggestions}
    />
  );
}
