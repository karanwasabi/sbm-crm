import { Suspense } from 'react';
import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { LeadDatabaseTableFallback } from '@/components/loading/lead-database-table-fallback';
import { buildLeadDatabaseHref, parseLeadDatabaseFilters } from '@/lib/lead-database-url';
import { isMarketingOnly } from '@/lib/access';
import { getLeadFilterOptions, getLeadSummary, getMyAccess, getWhatsAppFlags } from '@/utils/api';
import type { LeadFilterOptions, LeadSummary } from '@/types/crm';
import { LeadDatabaseTableLoader } from './lead-database-table-loader';

const EMPTY_SUMMARY: LeadSummary = {
  total: 0,
  withUnseenSuggestions: 0,
  byStage: {
    inquiry: 0,
    engaged: 0,
    registered: 0,
    newbie: 0,
    member: 0,
    grace: 0,
    lapsed: 0,
    transferred: 0,
    lost: 0,
  },
};

const EMPTY_FILTER_OPTIONS: LeadFilterOptions = {
  programs: [],
  batches: [],
  geography: [],
  sources: [],
  coaches: [],
  referrerCoaches: [],
  renewalDurations: [],
};

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let restrictToCreatedByMe = false;
  try {
    const access = await getMyAccess();
    restrictToCreatedByMe = isMarketingOnly(access.roles);
  } catch {
    restrictToCreatedByMe = false;
  }
  const defaultCreatedByMe = false;
  const filters = parseLeadDatabaseFilters(params, { defaultCreatedByMe });
  const suspenseKey = buildLeadDatabaseHref(filters);
  const includeReferrerCoaches = filters.referrerCoaches.length > 0;

  let summary = EMPTY_SUMMARY;
  let filterOptions = EMPTY_FILTER_OPTIONS;
  let whatsappSendsEnabled = false;

  const [summaryResult, filterOptionsResult, flagsResult] = await Promise.allSettled([
    getLeadSummary(filters.createdByMe),
    getLeadFilterOptions(includeReferrerCoaches),
    getWhatsAppFlags(),
  ]);

  if (summaryResult.status === 'fulfilled') {
    summary = summaryResult.value;
  }
  if (filterOptionsResult.status === 'fulfilled') {
    filterOptions = filterOptionsResult.value;
  }
  if (flagsResult.status === 'fulfilled') {
    whatsappSendsEnabled = flagsResult.value.sendsEnabled;
  }

  return (
    <LeadDatabaseView
      filters={filters}
      summary={summary}
      filterOptions={filterOptions}
      tagSuggestions={[]}
      emailTemplates={[]}
      whatsappTemplates={[]}
      whatsappSendsEnabled={whatsappSendsEnabled}
      restrictToCreatedByMe={restrictToCreatedByMe}
    >
      <Suspense key={suspenseKey} fallback={<LeadDatabaseTableFallback />}>
        <LeadDatabaseTableLoader filters={filters} summary={summary} />
      </Suspense>
    </LeadDatabaseView>
  );
}
