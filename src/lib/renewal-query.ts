export type RenewalSortKey = 'access_until' | 'name' | 'cohort' | 'product' | 'stage';
export type RenewalSortOrder = 'asc' | 'desc';

export type RenewalFilters = {
  q: string;
  sort: RenewalSortKey;
  order: RenewalSortOrder;
  expiry: string;
  product: string;
  stage: string;
  memberKind: string;
  access: string;
  bucket: string;
  page: number;
};

export const DEFAULT_RENEWAL_FILTERS: RenewalFilters = {
  q: '',
  sort: 'access_until',
  order: 'asc',
  expiry: '',
  product: '',
  stage: '',
  memberKind: '',
  access: '',
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

export function parseRenewalFilters(searchParams: Record<string, string | string[] | undefined>): RenewalFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0]?.trim() ?? '';
    return value?.trim() ?? '';
  };

  return {
    q: one('q'),
    sort: parseSort(one('sort')),
    order: one('order') === 'desc' ? 'desc' : 'asc',
    expiry: one('expiry'),
    product: one('product'),
    stage: one('stage'),
    memberKind: one('member_kind'),
    access: one('access'),
    bucket: one('bucket') === 'all' ? '' : one('bucket'),
    page: parsePage(one('page')),
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
  if (filters.expiry) params.set('expiry', filters.expiry);
  if (filters.product) params.set('product', filters.product);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.memberKind) params.set('member_kind', filters.memberKind);
  if (filters.access) params.set('access', filters.access);
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
