'use client';

import { buildLeadListSearchParams, LEAD_LIST_BULK_PAGE_SIZE } from '@/lib/lead-list-query';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import { mapLeadListRow, type LeadListApiRow } from '@/lib/map-lead-list-row';
import type { Lead, LeadListResult } from '@/types/crm';
import { createClient } from '@/utils/supabase/client';

const BULK_FETCH_CONCURRENCY = 3;

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
    items: LeadListApiRow[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };

  return {
    items: payload.items.map(mapLeadListRow),
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
