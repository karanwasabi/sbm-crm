import { type LeadDatabaseFilters } from '@/lib/lead-database-url';

export const LEAD_LIST_BULK_PAGE_SIZE = 100;

export function buildLeadListSearchParams(
  filters: LeadDatabaseFilters,
  overrides?: Partial<Pick<LeadDatabaseFilters, 'page' | 'pageSize'>>
): URLSearchParams {
  const page = overrides?.page ?? filters.page;
  const pageSize = overrides?.pageSize ?? filters.pageSize;
  const params = new URLSearchParams();

  if (filters.stages.length > 0) params.set('stage', filters.stages.join(','));
  if (filters.marketing && filters.marketing !== 'all') {
    params.set('marketing_contact_status', filters.marketing);
  }
  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
    if (filters.tagMode === 'or') params.set('tag_mode', 'or');
  }
  if (filters.excludeTags.length > 0) {
    params.set('exclude_tags', filters.excludeTags.join(','));
  }
  if (filters.q) params.set('q', filters.q);
  if (filters.programs.length > 0) params.set('programs', filters.programs.join(','));
  if (filters.batches.length > 0) params.set('batches', filters.batches.join(','));
  if (filters.geography.length > 0) params.set('geography', filters.geography.join(','));
  if (filters.sources.length > 0) params.set('sources', filters.sources.join(','));
  if (filters.coaches.length > 0) params.set('coaches', filters.coaches.join(','));
  if (filters.referrerCoaches.length > 0) params.set('referrer_coaches', filters.referrerCoaches.join(','));
  if (filters.addedFrom) params.set('added_from', filters.addedFrom);
  if (filters.addedTo) params.set('added_to', filters.addedTo);
  if (filters.updatedFrom) params.set('updated_from', filters.updatedFrom);
  if (filters.updatedTo) params.set('updated_to', filters.updatedTo);
  if (filters.sort !== 'created_at') params.set('sort', filters.sort);
  if (filters.order !== 'desc') params.set('order', filters.order);
  if (filters.hasUnseenSuggestions) params.set('has_unseen_suggestions', 'true');
  if (filters.phoneDuplicates) params.set('phone_duplicates', 'true');
  if (filters.createdByMe) params.set('created_by_me', '1');
  if (filters.perfSource) params.set('perf_source', filters.perfSource);
  if (filters.metaCampaignId) params.set('meta_campaign_id', filters.metaCampaignId);
  if (filters.metaCampaignUnattributed) params.set('meta_campaign_unattributed', 'true');
  if (filters.utmContent) params.set('utm_content', filters.utmContent);
  if (filters.paidFrom) params.set('paid_from', filters.paidFrom);
  if (filters.paidTo) params.set('paid_to', filters.paidTo);
  if (filters.offlineCrmPaid) params.set('offline_crm_paid', 'true');
  if (filters.renewalDurations.length > 0) params.set('renewal_durations', filters.renewalDurations.join(','));
  if (page > 1) params.set('page', String(page));
  if (pageSize !== 50) params.set('page_size', String(pageSize));

  return params;
}
