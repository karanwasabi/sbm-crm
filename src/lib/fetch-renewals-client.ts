'use client';

import { buildRenewalsSearchParams, RENEWAL_LIST_BULK_PAGE_SIZE, type RenewalFilters } from '@/lib/renewal-query';
import type { RenewalListPage, RenewalRow } from '@/types/crm';
import { createClient } from '@/utils/supabase/client';

type ApiRenewalRowResponse = {
  checkout_session_id: string;
  user_id: string;
  lead_id?: string | null;
  member_name: string;
  member_initials: string;
  program_name: string;
  cohort_name: string;
  next_charge_at?: string | null;
  access_until?: string | null;
  access_until_label?: string;
  monthly_total_paise: number;
  lifetime_paid_paise?: number;
  retention_bucket: RenewalRow['retentionBucket'];
  subscription_status: string;
  cancel_at_period_end: boolean;
  payment_method_summary?: string;
  risk: RenewalRow['risk'];
  days_until_charge?: number | null;
  lifecycle_stage?: string | null;
  member_kind?: string | null;
  checkout_product?: string | null;
  renewal_plan_key?: string | null;
  membership_product?: string;
  access_state?: string;
  days_until_access_end?: number | null;
};

const BULK_FETCH_CONCURRENCY = 3;

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

function mapRenewalRow(row: ApiRenewalRowResponse): RenewalRow {
  return {
    checkoutSessionId: row.checkout_session_id,
    userId: row.user_id,
    leadId: row.lead_id,
    memberName: row.member_name,
    memberInitials: row.member_initials,
    programName: row.program_name,
    cohortName: row.cohort_name,
    nextChargeAt: row.next_charge_at,
    accessUntil: row.access_until,
    accessUntilLabel: row.access_until_label,
    monthlyTotalPaise: row.monthly_total_paise,
    lifetimePaidPaise: row.lifetime_paid_paise ?? 0,
    retentionBucket: row.retention_bucket,
    subscriptionStatus: row.subscription_status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    paymentMethodSummary: row.payment_method_summary,
    risk: row.risk,
    daysUntilCharge: row.days_until_charge,
    lifecycleStage: row.lifecycle_stage,
    memberKind: row.member_kind,
    checkoutProduct: row.checkout_product,
    renewalPlanKey: row.renewal_plan_key,
    membershipProduct: row.membership_product ?? 'fixed',
    accessState: row.access_state ?? 'active',
    daysUntilAccessEnd: row.days_until_access_end,
  };
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

async function fetchRenewalsPage(
  filters: RenewalFilters,
  page: number,
  pageSize: number,
  token: string,
  signal?: AbortSignal
): Promise<RenewalListPage> {
  const params = buildRenewalsSearchParams({ ...filters, page });
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  const query = params.toString();
  const response = await fetch(`${getBackendUrl()}/admin/renewals${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    throw new Error('Failed to load members.');
  }
  const payload = (await response.json()) as {
    items?: ApiRenewalRowResponse[];
    total?: number;
    page?: number;
    page_size?: number;
    total_pages?: number;
  };
  return {
    items: (payload.items ?? []).map(mapRenewalRow),
    total: payload.total ?? 0,
    page: payload.page ?? page,
    pageSize: payload.page_size ?? pageSize,
    totalPages: payload.total_pages ?? 0,
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

export async function fetchAllFilteredRenewals(filters: RenewalFilters, signal?: AbortSignal): Promise<RenewalRow[]> {
  const pageSize = RENEWAL_LIST_BULK_PAGE_SIZE;
  const token = await getAccessToken();
  const first = await fetchRenewalsPage(filters, 1, pageSize, token, signal);
  if (first.totalPages <= 1) {
    return first.items;
  }

  const remainingPages = Array.from({ length: first.totalPages - 1 }, (_, index) => index + 2);
  const rest = await mapPool(remainingPages, BULK_FETCH_CONCURRENCY, (page) =>
    fetchRenewalsPage(filters, page, pageSize, token, signal)
  );
  return [...first.items, ...rest.flatMap((page) => page.items)];
}
