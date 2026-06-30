import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { formatTagSlugsParam } from '@/lib/lead-tags';
import type { MarketingContactStatus, TagFilterMode } from '@/types/crm';

export type LeadDatabaseSort = 'created_at' | 'updated_at' | 'name';
export type LeadDatabaseSortOrder = 'asc' | 'desc';

export type LeadDatabaseFilters = {
  stage: string;
  marketing: string;
  tags: string[];
  tagMode: TagFilterMode;
  q: string;
  programs: string[];
  batches: string[];
  geography: string[];
  sources: string[];
  addedFrom: string;
  addedTo: string;
  updatedFrom: string;
  updatedTo: string;
  sort: LeadDatabaseSort;
  order: LeadDatabaseSortOrder;
  page: number;
  pageSize: number;
};

export const DEFAULT_LEAD_DATABASE_FILTERS: LeadDatabaseFilters = {
  stage: 'all',
  marketing: 'all',
  tags: [],
  tagMode: 'and',
  q: '',
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
  page: 1,
  pageSize: 50,
};

export const MARKETING_FILTER_OPTIONS: Array<{ id: MarketingContactStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All contacts' },
  { id: 'active', label: MARKETING_CONTACT_STATUS_LABELS.active },
  { id: 'eligible', label: MARKETING_CONTACT_STATUS_LABELS.eligible },
  { id: 'no_consent', label: MARKETING_CONTACT_STATUS_LABELS.no_consent },
  { id: 'unsubscribed', label: MARKETING_CONTACT_STATUS_LABELS.unsubscribed },
];

function parseCommaList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseSort(raw?: string): LeadDatabaseSort {
  if (raw === 'updated_at' || raw === 'name') return raw;
  return 'created_at';
}

function parseOrder(raw?: string): LeadDatabaseSortOrder {
  return raw === 'asc' ? 'asc' : 'desc';
}

export function parseLeadDatabaseFilters(params: Record<string, string | string[] | undefined>): LeadDatabaseFilters {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    stage: get('stage')?.trim() || 'all',
    marketing: get('marketing')?.trim() || 'all',
    tags: parseCommaList(get('tags')),
    tagMode: get('tag_mode')?.trim() === 'or' ? 'or' : 'and',
    q: get('q')?.trim() || '',
    programs: parseCommaList(get('programs')),
    batches: parseCommaList(get('batches')),
    geography: parseCommaList(get('geography')),
    sources: parseCommaList(get('sources')),
    addedFrom: get('added_from')?.trim() || '',
    addedTo: get('added_to')?.trim() || '',
    updatedFrom: get('updated_from')?.trim() || '',
    updatedTo: get('updated_to')?.trim() || '',
    sort: parseSort(get('sort')),
    order: parseOrder(get('order')),
    page: parsePositiveInt(get('page'), 1),
    pageSize: parsePositiveInt(get('page_size'), 50),
  };
}

export function mergeLeadDatabaseFilters(
  filters: LeadDatabaseFilters,
  patch: Partial<LeadDatabaseFilters>,
  options?: { resetPage?: boolean }
): LeadDatabaseFilters {
  const next = { ...filters, ...patch };
  if (options?.resetPage !== false) {
    const paginationOnly =
      Object.keys(patch).length > 0 && Object.keys(patch).every((key) => key === 'page' || key === 'pageSize');
    if (!paginationOnly) {
      next.page = 1;
    }
  }
  return next;
}

export function buildLeadDatabaseHref(filters: LeadDatabaseFilters, patch?: Partial<LeadDatabaseFilters>): string {
  const merged = patch ? mergeLeadDatabaseFilters(filters, patch) : filters;
  const params = new URLSearchParams();

  if (merged.stage !== 'all') params.set('stage', merged.stage);
  if (merged.marketing !== 'all') params.set('marketing', merged.marketing);
  if (merged.tags.length > 0) {
    params.set('tags', formatTagSlugsParam(merged.tags));
    if (merged.tagMode === 'or') params.set('tag_mode', 'or');
  }
  if (merged.q) params.set('q', merged.q);
  if (merged.programs.length > 0) params.set('programs', merged.programs.join(','));
  if (merged.batches.length > 0) params.set('batches', merged.batches.join(','));
  if (merged.geography.length > 0) params.set('geography', merged.geography.join(','));
  if (merged.sources.length > 0) params.set('sources', merged.sources.join(','));
  if (merged.addedFrom) params.set('added_from', merged.addedFrom);
  if (merged.addedTo) params.set('added_to', merged.addedTo);
  if (merged.updatedFrom) params.set('updated_from', merged.updatedFrom);
  if (merged.updatedTo) params.set('updated_to', merged.updatedTo);
  if (merged.sort !== 'created_at') params.set('sort', merged.sort);
  if (merged.order !== 'desc') params.set('order', merged.order);
  if (merged.page > 1) params.set('page', String(merged.page));
  if (merged.pageSize !== 50) params.set('page_size', String(merged.pageSize));

  const query = params.toString();
  return query ? `/database?${query}` : '/database';
}
