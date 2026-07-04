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
  if (filters.q) params.set('q', filters.q);
  if (filters.programs.length > 0) params.set('programs', filters.programs.join(','));
  if (filters.batches.length > 0) params.set('batches', filters.batches.join(','));
  if (filters.geography.length > 0) params.set('geography', filters.geography.join(','));
  if (filters.sources.length > 0) params.set('sources', filters.sources.join(','));
  if (filters.addedFrom) params.set('added_from', filters.addedFrom);
  if (filters.addedTo) params.set('added_to', filters.addedTo);
  if (filters.updatedFrom) params.set('updated_from', filters.updatedFrom);
  if (filters.updatedTo) params.set('updated_to', filters.updatedTo);
  if (filters.sort !== 'created_at') params.set('sort', filters.sort);
  if (filters.order !== 'desc') params.set('order', filters.order);
  if (filters.hasUnseenSuggestions) params.set('has_unseen_suggestions', 'true');
  if (page > 1) params.set('page', String(page));
  if (pageSize !== 50) params.set('page_size', String(pageSize));

  return params;
}
