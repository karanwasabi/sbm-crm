export type RenewalSortKey = 'access_until' | 'name' | 'cohort' | 'product' | 'stage';
export type RenewalSortOrder = 'asc' | 'desc';

export type RenewalFilters = {
  q: string;
  sort: RenewalSortKey;
  order: RenewalSortOrder;
  expiries: string[];
  products: string[];
  statuses: string[];
  access: string[];
  batches: string[];
  bucket: string;
  page: number;
};

export const DEFAULT_RENEWAL_FILTERS: RenewalFilters = {
  q: '',
  sort: 'access_until',
  order: 'asc',
  expiries: [],
  products: [],
  statuses: [],
  access: [],
  batches: [],
  bucket: '',
  page: 1,
};

export const RENEWAL_LIST_BULK_PAGE_SIZE = 100;

const SORT_KEYS: RenewalSortKey[] = ['access_until', 'name', 'cohort', 'product', 'stage'];

function parseSort(raw?: string): RenewalSortKey {
  return SORT_KEYS.includes(raw as RenewalSortKey) ? (raw as RenewalSortKey) : 'access_until';
}

function parsePage(raw?: string): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function one(searchParams: Record<string, string | string[] | undefined>, key: string): string {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0]?.trim() ?? '';
  return value?.trim() ?? '';
}

function parseList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStatuses(searchParams: Record<string, string | string[] | undefined>): string[] {
  const fromStatus = parseList(one(searchParams, 'status'));
  if (fromStatus.length > 0) return fromStatus;

  const statuses: string[] = [];
  const stage = one(searchParams, 'stage');
  const memberKind = one(searchParams, 'member_kind');
  for (const value of parseList(stage)) {
    if (value === 'newbie' || value === 'member') statuses.push(value);
  }
  for (const value of parseList(memberKind)) {
    if (value === 'renewal' || value === 'returnee') statuses.push(value);
  }
  return statuses;
}

export function parseRenewalFilters(searchParams: Record<string, string | string[] | undefined>): RenewalFilters {
  return {
    q: one(searchParams, 'q'),
    sort: parseSort(one(searchParams, 'sort')),
    order: one(searchParams, 'order') === 'desc' ? 'desc' : 'asc',
    expiries: parseList(one(searchParams, 'expiry')),
    products: parseList(one(searchParams, 'product')),
    statuses: parseStatuses(searchParams),
    access: parseList(one(searchParams, 'access')),
    batches: parseList(one(searchParams, 'batches') || one(searchParams, 'batch')),
    bucket: one(searchParams, 'bucket') === 'all' ? '' : one(searchParams, 'bucket'),
    page: parsePage(one(searchParams, 'page')),
  };
}

export function mergeRenewalFilters(filters: RenewalFilters, patch: Partial<RenewalFilters>): RenewalFilters {
  const next = { ...filters, ...patch };
  const paginationOnly = Object.keys(patch).length > 0 && Object.keys(patch).every((key) => key === 'page');
  if (!paginationOnly && patch.page == null) {
    next.page = 1;
  }
  return next;
}

export function buildRenewalsSearchParams(filters: RenewalFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.sort !== 'access_until') params.set('sort', filters.sort);
  if (filters.order !== 'asc') params.set('order', filters.order);
  if (filters.expiries.length > 0) params.set('expiry', filters.expiries.join(','));
  if (filters.products.length > 0) params.set('product', filters.products.join(','));
  if (filters.statuses.length > 0) params.set('status', filters.statuses.join(','));
  if (filters.access.length > 0) params.set('access', filters.access.join(','));
  if (filters.batches.length > 0) params.set('batches', filters.batches.join(','));
  if (filters.bucket) params.set('bucket', filters.bucket);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function buildRenewalsHref(filters: RenewalFilters, patch?: Partial<RenewalFilters>): string {
  const merged = patch ? mergeRenewalFilters(filters, patch) : filters;
  const query = buildRenewalsSearchParams(merged).toString();
  return query ? `/renewals?${query}` : '/renewals';
}

export function renewalFiltersKey(filters: RenewalFilters): string {
  return buildRenewalsSearchParams(filters).toString();
}
