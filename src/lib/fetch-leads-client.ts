'use client';

import { buildLeadListSearchParams, LEAD_LIST_BULK_PAGE_SIZE } from '@/lib/lead-list-query';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import type { Lead, LeadListResult } from '@/types/crm';
import { createClient } from '@/utils/supabase/client';

type ApiLeadResponse = {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  location: string;
  country_code?: string | null;
  city?: string | null;
  stage: import('@/types/crm').LifecycleStage;
  medium?: import('@/types/crm').LeadMedium | null;
  interest?: string | null;
  batch?: string | null;
  system_tags?: string[];
  manual_tags?: string[];
  tags?: string[];
  enriched: boolean;
  dedup: boolean;
  phone_duplicate?: boolean;
  phone_duplicate_count?: number;
  added_at: string;
  updated_at?: string | null;
  marketing_contact_status?: import('@/types/crm').MarketingContactStatus | null;
  marketing_contact_synced_at?: string | null;
  marketing_unsubscribed_at?: string | null;
  unseen_suggestion_count?: number;
  source_label?: string | null;
  member_kind?: 'renewal' | 'returnee' | null;
  latest_renewal_plan_key?: string | null;
  latest_renewal_duration?: string | null;
  latest_renewal_category?: string | null;
};

const BULK_FETCH_CONCURRENCY = 3;

function mapLead(row: ApiLeadResponse): Lead {
  const firstName = row.first_name;
  const lastName = row.last_name ?? '';
  return {
    id: row.id,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone ?? '',
    location: row.location,
    countryCode: row.country_code ?? '',
    city: row.city ?? '',
    stage: row.stage,
    medium: row.medium ?? 'offline',
    sourceLabel: row.source_label ?? '',
    interest: row.interest || '—',
    batch: row.batch || '—',
    systemTags: row.system_tags ?? [],
    manualTags: row.manual_tags ?? [],
    tags: row.tags ?? [],
    enriched: row.enriched,
    dedup: row.dedup,
    phoneDuplicate: row.phone_duplicate ?? false,
    phoneDuplicateCount: row.phone_duplicate_count ?? 0,
    addedAt: row.added_at,
    updatedAt: row.updated_at ?? row.added_at,
    marketingContactStatus: row.marketing_contact_status ?? 'no_consent',
    marketingContactSyncedAt: row.marketing_contact_synced_at ?? null,
    marketingUnsubscribedAt: row.marketing_unsubscribed_at ?? null,
    unseenSuggestionCount: row.unseen_suggestion_count ?? 0,
    memberKind: row.member_kind === 'renewal' || row.member_kind === 'returnee' ? row.member_kind : null,
    latestRenewalPlanKey: row.latest_renewal_plan_key?.trim() || null,
    latestRenewalDuration: row.latest_renewal_duration?.trim() || null,
    latestRenewalCategory: row.latest_renewal_category?.trim() || null,
  };
}

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not authenticated.');
  }
  return token;
}

async function fetchLeadListPage(
  filters: LeadDatabaseFilters,
  page: number,
  pageSize: number,
  token: string
): Promise<LeadListResult> {
  const params = buildLeadListSearchParams(filters, { page, pageSize });
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${getBackendUrl()}/admin/leads${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load leads.');
  }

  const payload = (await response.json()) as {
    items: ApiLeadResponse[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };

  return {
    items: payload.items.map(mapLead),
    total: payload.total,
    page: payload.page,
    pageSize: payload.page_size,
    totalPages: payload.total_pages,
  };
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function fetchAllFilteredLeads(filters: LeadDatabaseFilters): Promise<Lead[]> {
  const pageSize = LEAD_LIST_BULK_PAGE_SIZE;
  const token = await getAccessToken();
  const first = await fetchLeadListPage(filters, 1, pageSize, token);
  if (first.totalPages <= 1) {
    return first.items;
  }

  const remainingPages = Array.from({ length: first.totalPages - 1 }, (_, index) => index + 2);
  const rest = await mapPool(remainingPages, BULK_FETCH_CONCURRENCY, (page) =>
    fetchLeadListPage(filters, page, pageSize, token)
  );

  return [...first.items, ...rest.flatMap((page) => page.items)];
}

export async function fetchAllFilteredLeadIds(filters: LeadDatabaseFilters): Promise<string[]> {
  const pageSize = LEAD_LIST_BULK_PAGE_SIZE;
  const token = await getAccessToken();

  async function fetchIdsPage(page: number): Promise<{ ids: string[]; totalPages: number }> {
    const params = buildLeadListSearchParams(filters, { page, pageSize });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${getBackendUrl()}/admin/leads/ids${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Failed to load lead ids.');
    }
    const payload = (await response.json()) as {
      ids: string[];
      total_pages: number;
    };
    return { ids: payload.ids ?? [], totalPages: payload.total_pages ?? 0 };
  }

  const first = await fetchIdsPage(1);
  if (first.totalPages <= 1) {
    return first.ids;
  }

  const remainingPages = Array.from({ length: first.totalPages - 1 }, (_, index) => index + 2);
  const rest = await mapPool(remainingPages, BULK_FETCH_CONCURRENCY, fetchIdsPage);
  return [...first.ids, ...rest.flatMap((page) => page.ids)];
}
