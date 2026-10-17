import type { CommsChannel } from '@/lib/comms-channel';
import { commsTabHref } from '@/lib/comms-channel';
import { WA_ACCOUNT_SEARCH_PARAM } from '@/lib/whatsapp-account';

export type CommsTemplateSortKey = 'updated_at_desc' | 'updated_at_asc' | 'name_asc' | 'name_desc';

export type CommsTemplateFilters = {
  channel: CommsChannel;
  q: string;
  status: string;
  classification: string;
  category: string;
  purpose: string;
  sort: CommsTemplateSortKey;
  page: number;
  pageSize: number;
  accountId: string;
};

export const COMMS_TEMPLATE_PAGE_SIZE = 25;

export const COMMS_TEMPLATE_SORT_OPTIONS: { value: CommsTemplateSortKey; label: string }[] = [
  { value: 'updated_at_desc', label: 'Recently updated' },
  { value: 'updated_at_asc', label: 'Oldest updated' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export const DEFAULT_COMMS_TEMPLATE_FILTERS: Omit<CommsTemplateFilters, 'channel'> = {
  q: '',
  status: '',
  classification: '',
  category: '',
  purpose: '',
  sort: 'updated_at_desc',
  page: 1,
  pageSize: COMMS_TEMPLATE_PAGE_SIZE,
  accountId: '',
};

const SORT_KEYS: CommsTemplateSortKey[] = ['updated_at_desc', 'updated_at_asc', 'name_asc', 'name_desc'];

function one(searchParams: Record<string, string | string[] | undefined>, key: string): string {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0]?.trim() ?? '';
  return value?.trim() ?? '';
}

function parseSort(raw: string): CommsTemplateSortKey {
  return SORT_KEYS.includes(raw as CommsTemplateSortKey) ? (raw as CommsTemplateSortKey) : 'updated_at_desc';
}

function parsePage(raw: string): number {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function parseCommsTemplateFilters(
  channel: CommsChannel,
  searchParams: Record<string, string | string[] | undefined>
): CommsTemplateFilters {
  return {
    channel,
    q: one(searchParams, 'q'),
    status: one(searchParams, 'status'),
    classification: channel === 'email' ? one(searchParams, 'classification') : '',
    category: channel === 'whatsapp' ? one(searchParams, 'category') : '',
    purpose: channel === 'whatsapp' ? one(searchParams, 'purpose') : '',
    sort: parseSort(one(searchParams, 'sort')),
    page: parsePage(one(searchParams, 'page')),
    pageSize: COMMS_TEMPLATE_PAGE_SIZE,
    accountId: channel === 'whatsapp' ? one(searchParams, WA_ACCOUNT_SEARCH_PARAM) : '',
  };
}

export function mergeCommsTemplateFilters(
  filters: CommsTemplateFilters,
  patch: Partial<CommsTemplateFilters>
): CommsTemplateFilters {
  const next = { ...filters, ...patch, channel: filters.channel };
  const paginationOnly = Object.keys(patch).length > 0 && Object.keys(patch).every((key) => key === 'page');
  if (!paginationOnly && patch.page == null) {
    next.page = 1;
  }
  return next;
}

export function buildCommsTemplatesSearchParams(filters: CommsTemplateFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.channel === 'email' && filters.classification) {
    params.set('classification', filters.classification);
  }
  if (filters.channel === 'whatsapp') {
    if (filters.category) params.set('category', filters.category);
    if (filters.purpose) params.set('purpose', filters.purpose);
    if (filters.accountId) params.set(WA_ACCOUNT_SEARCH_PARAM, filters.accountId);
  }
  if (filters.sort !== 'updated_at_desc') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function buildCommsTemplatesHref(filters: CommsTemplateFilters, patch?: Partial<CommsTemplateFilters>): string {
  const merged = patch ? mergeCommsTemplateFilters(filters, patch) : filters;
  const query = buildCommsTemplatesSearchParams(merged).toString();
  const base = commsTabHref(merged.channel, 'templates');
  return query ? `${base}?${query}` : base;
}

export function buildCommsTemplatesApiQuery(filters: CommsTemplateFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('page_size', String(filters.pageSize));
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.channel === 'email' && filters.classification) {
    params.set('classification', filters.classification);
  }
  if (filters.channel === 'whatsapp') {
    if (filters.category) params.set('category', filters.category);
    if (filters.purpose) params.set('purpose', filters.purpose);
    if (filters.accountId) params.set('account_id', filters.accountId);
  }
  if (filters.sort) params.set('sort', filters.sort);
  return params;
}

/** Last valid page for a result set (always ≥ 1). */
export function commsTemplateTotalPages(total: number, pageSize: number): number {
  const size = pageSize > 0 ? pageSize : COMMS_TEMPLATE_PAGE_SIZE;
  return Math.max(1, Math.ceil(Math.max(total, 0) / size));
}

/** Clamp a requested page into [1, last page]. */
export function clampCommsTemplatePage(page: number, total: number, pageSize: number): number {
  const maxPage = commsTemplateTotalPages(total, pageSize);
  if (!Number.isFinite(page) || page < 1) return 1;
  if (page > maxPage) return maxPage;
  return page;
}
