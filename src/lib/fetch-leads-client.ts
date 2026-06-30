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
  added_at: string;
  updated_at?: string | null;
  marketing_contact_status?: import('@/types/crm').MarketingContactStatus | null;
  marketing_contact_synced_at?: string | null;
  marketing_unsubscribed_at?: string | null;
  source_label?: string | null;
};

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
    addedAt: row.added_at,
    updatedAt: row.updated_at ?? row.added_at,
    marketingContactStatus: row.marketing_contact_status ?? 'no_consent',
    marketingContactSyncedAt: row.marketing_contact_synced_at ?? null,
    marketingUnsubscribedAt: row.marketing_unsubscribed_at ?? null,
  };
}

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

async function fetchLeadListPage(
  filters: LeadDatabaseFilters,
  page: number,
  pageSize: number
): Promise<LeadListResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not authenticated.');
  }

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

export async function fetchAllFilteredLeads(filters: LeadDatabaseFilters): Promise<Lead[]> {
  const pageSize = LEAD_LIST_BULK_PAGE_SIZE;
  let page = 1;
  let totalPages = 1;
  const all: Lead[] = [];

  while (page <= totalPages) {
    const result = await fetchLeadListPage(filters, page, pageSize);
    all.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return all;
}
