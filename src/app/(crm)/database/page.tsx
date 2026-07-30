import { Suspense } from 'react';
import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { LeadDatabaseTableFallback } from '@/components/loading/lead-database-table-fallback';
import { buildLeadDatabaseHref, parseLeadDatabaseFilters } from '@/lib/lead-database-url';
import {
  getLeadFilterOptions,
  getLeadSummary,
  getWhatsAppFlags,
  listEmailTemplates,
  listTagSuggestions,
  listWhatsAppTemplates,
} from '@/utils/api';
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
  let emailTemplates: import('@/utils/api').EmailTemplate[] = [];
  let whatsappTemplates: import('@/utils/api').WhatsAppTemplate[] = [];
  let whatsappSendsEnabled = false;

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

  try {
    emailTemplates = await listEmailTemplates();
  } catch {
    emailTemplates = [];
  }

  try {
    const [flags, templates] = await Promise.all([
      getWhatsAppFlags().catch(() => ({ sendsEnabled: false, templatesEnabled: false })),
      listWhatsAppTemplates().catch(() => [] as import('@/utils/api').WhatsAppTemplate[]),
    ]);
    whatsappSendsEnabled = flags.sendsEnabled;
    whatsappTemplates = templates;
  } catch {
    whatsappTemplates = [];
    whatsappSendsEnabled = false;
  }

  return (
    <LeadDatabaseView
      filters={filters}
      summary={summary}
      filterOptions={filterOptions}
      tagSuggestions={tagSuggestions}
      emailTemplates={emailTemplates}
      whatsappTemplates={whatsappTemplates}
      whatsappSendsEnabled={whatsappSendsEnabled}
    >
      <Suspense key={suspenseKey} fallback={<LeadDatabaseTableFallback />}>
        <LeadDatabaseTableLoader filters={filters} summary={summary} />
      </Suspense>
    </LeadDatabaseView>
  );
}
