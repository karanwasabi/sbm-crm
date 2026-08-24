export const COHORT_MEMBER_SORT_KEYS = [
  'name',
  'coach',
  'whatsapp',
  'city',
  'country',
  'timezone',
  'duration',
  'membershipEnds',
  'extended',
  'enrolled',
] as const;

export type CohortMemberSortKey = (typeof COHORT_MEMBER_SORT_KEYS)[number];
export type CohortMemberSortOrder = 'asc' | 'desc';

export type CohortMemberListQuery = {
  q: string;
  statuses: string[];
  onboarding: string[];
  coaches: string[];
  cities: string[];
  sex: string[];
  countries: string[];
  timezones: string[];
  sort: CohortMemberSortKey;
  order: CohortMemberSortOrder;
  showBodyMetrics: boolean;
};

export const DEFAULT_COHORT_MEMBER_LIST_QUERY: CohortMemberListQuery = {
  q: '',
  statuses: [],
  onboarding: [],
  coaches: [],
  cities: [],
  sex: [],
  countries: [],
  timezones: [],
  sort: 'enrolled',
  order: 'desc',
  showBodyMetrics: false,
};

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

function parseSort(raw: string): CohortMemberSortKey {
  return (COHORT_MEMBER_SORT_KEYS as readonly string[]).includes(raw) ? (raw as CohortMemberSortKey) : 'enrolled';
}

export function parseCohortMemberListQuery(
  searchParams: Record<string, string | string[] | undefined>
): CohortMemberListQuery {
  const sort = parseSort(one(searchParams, 'sort'));
  const orderRaw = one(searchParams, 'order');
  const defaultOrder: CohortMemberSortOrder = sort === 'enrolled' ? 'desc' : 'asc';
  return {
    q: one(searchParams, 'q'),
    statuses: parseList(one(searchParams, 'status')),
    onboarding: parseList(one(searchParams, 'onboarding')),
    coaches: parseList(one(searchParams, 'coaches')),
    cities: parseList(one(searchParams, 'cities')),
    sex: parseList(one(searchParams, 'sex')),
    countries: parseList(one(searchParams, 'countries')),
    timezones: parseList(one(searchParams, 'timezones')),
    sort,
    order: orderRaw === 'asc' || orderRaw === 'desc' ? orderRaw : defaultOrder,
    showBodyMetrics: one(searchParams, 'metrics') === '1',
  };
}

export function mergeCohortMemberListQuery(
  query: CohortMemberListQuery,
  patch: Partial<CohortMemberListQuery>
): CohortMemberListQuery {
  return { ...query, ...patch };
}

export function buildCohortMemberListSearchParams(query: CohortMemberListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set('q', query.q.trim());
  if (query.statuses.length > 0) params.set('status', query.statuses.join(','));
  if (query.onboarding.length > 0) params.set('onboarding', query.onboarding.join(','));
  if (query.coaches.length > 0) params.set('coaches', query.coaches.join(','));
  if (query.cities.length > 0) params.set('cities', query.cities.join(','));
  if (query.sex.length > 0) params.set('sex', query.sex.join(','));
  if (query.countries.length > 0) params.set('countries', query.countries.join(','));
  if (query.timezones.length > 0) params.set('timezones', query.timezones.join(','));
  if (query.sort !== 'enrolled') params.set('sort', query.sort);
  const defaultOrder: CohortMemberSortOrder = query.sort === 'enrolled' ? 'desc' : 'asc';
  if (query.order !== defaultOrder) params.set('order', query.order);
  if (query.showBodyMetrics) params.set('metrics', '1');
  return params;
}

export function buildCohortDetailHref(cohortId: string, query: CohortMemberListQuery): string {
  const params = buildCohortMemberListSearchParams(query);
  const qs = params.toString();
  return qs ? `/programs/cohorts/${cohortId}?${qs}` : `/programs/cohorts/${cohortId}`;
}

export function cohortMemberListQueryKey(query: CohortMemberListQuery): string {
  return buildCohortMemberListSearchParams(query).toString();
}
