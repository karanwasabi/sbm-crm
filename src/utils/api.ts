import { cache } from 'react';
import type { StaffAccessRole } from '@/lib/access';
import { LOGIN_PRODUCT_CRM } from '@/lib/login-access';
import type { Profile, ProfilePatch } from '@/types/profile';
import type { Country, CountryCity } from '@/types/reference';
import { createClient } from '@/utils/supabase/server';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

export async function sendLoginOTP(
  email: string,
  product: typeof LOGIN_PRODUCT_CRM,
  extraHeaders: HeadersInit = {}
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}/auth/login/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), product }),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach the backend. Is it running?', 503);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Failed to send OTP (${response.status})`, response.status);
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function requireApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('Not authenticated.', 401);
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach the backend. Is it running?', 503);
  }

  if (response.status === 401 || response.status === 403) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Request failed (${response.status})`, response.status);
  }

  return response;
}

export async function getMyAccess() {
  const response = await requireApiFetch('/me/access');
  if (!response.ok) {
    throw new ApiError(`Failed to load access (${response.status})`, response.status);
  }
  return response.json() as Promise<import('@/lib/access').AccessClaims>;
}

export type StaffMember = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: StaffAccessRole[];
};

export type StaffList = {
  active: StaffMember[];
  inactive: StaffMember[];
};

export async function listStaff(): Promise<StaffList> {
  const response = await requireApiFetch('/admin/staff');
  if (!response.ok) {
    throw new ApiError('Failed to load staff.', response.status);
  }
  return response.json() as Promise<StaffList>;
}

export type CreateStaffInput = {
  first_name: string;
  last_name?: string;
  email: string;
  roles: StaffAccessRole[];
};

export async function createStaff(input: CreateStaffInput): Promise<StaffMember> {
  const response = await requireApiFetch('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to create staff user.', response.status);
  }

  return response.json() as Promise<StaffMember>;
}

export async function updateStaffAccess(userId: string, roles: StaffAccessRole[]): Promise<StaffMember> {
  const response = await requireApiFetch(`/admin/staff/${encodeURIComponent(userId)}/access`, {
    method: 'PATCH',
    body: JSON.stringify({ roles }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update staff access.', response.status);
  }

  return response.json() as Promise<StaffMember>;
}

export async function revokeStaffAccess(userId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/staff/${encodeURIComponent(userId)}/revoke-access`, {
    method: 'POST',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to revoke staff access.', response.status);
  }
}

export async function getLatestProfile(): Promise<Profile> {
  const response = await requireApiFetch('/me');

  if (response.status === 404) {
    throw new ApiError('No profile found for your account.', 404);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(`Failed to load profile (${response.status}): ${body}`, response.status);
  }

  return response.json() as Promise<Profile>;
}

export async function patchProfile(body: ProfilePatch): Promise<Profile> {
  const response = await requireApiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Failed to update profile (${response.status})`, response.status);
  }

  return response.json() as Promise<Profile>;
}

export const fetchCountries = cache(async (): Promise<Country[]> => {
  const response = await requireApiFetch('/reference/countries');
  if (!response.ok) {
    throw new ApiError('Failed to load countries.', response.status);
  }
  return response.json() as Promise<Country[]>;
});

export async function fetchCountryCities(countryCode: string): Promise<CountryCity[]> {
  const response = await requireApiFetch(`/reference/countries/${encodeURIComponent(countryCode)}/cities`);
  if (!response.ok) {
    throw new ApiError('Failed to load cities.', response.status);
  }
  return response.json() as Promise<CountryCity[]>;
}

type ApiLeadResponse = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  location: string;
  country_code: string | null;
  city: string | null;
  stage: import('@/types/crm').LifecycleStage;
  medium: import('@/types/crm').LeadMedium;
  interest: string;
  batch: string;
  tags: string[];
  enriched: boolean;
  dedup: boolean;
  added_at: string;
  manual_source?: import('@/types/crm').ManualLeadSource;
  notes?: string | null;
  member_user_id?: string | null;
  can_mark_lost?: boolean;
  timeline?: import('@/types/crm').TimelineEvent[];
};

function mapLead(row: ApiLeadResponse): import('@/types/crm').Lead {
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
    interest: row.interest || '—',
    batch: row.batch || '—',
    tags: row.tags ?? [],
    enriched: row.enriched,
    dedup: row.dedup,
    addedAt: row.added_at,
  };
}

export async function createLead(input: import('@/types/crm').CreateLeadInput): Promise<import('@/types/crm').Lead> {
  const response = await requireApiFetch('/admin/leads', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to create lead.', response.status);
  }

  const row = (await response.json()) as ApiLeadResponse;
  return mapLead(row);
}

export async function listLeads(stage?: string): Promise<import('@/types/crm').Lead[]> {
  const query = stage && stage !== 'all' ? `?stage=${encodeURIComponent(stage)}` : '';
  const response = await requireApiFetch(`/admin/leads${query}`);
  if (!response.ok) {
    throw new ApiError('Failed to load leads.', response.status);
  }
  const rows = (await response.json()) as ApiLeadResponse[];
  return rows.map(mapLead);
}

export const getLeadSummary = cache(async (): Promise<import('@/types/crm').LeadSummary> => {
  const response = await requireApiFetch('/admin/leads/summary');
  if (!response.ok) {
    throw new ApiError('Failed to load lead summary.', response.status);
  }
  const payload = (await response.json()) as {
    total: number;
    by_stage: Record<import('@/types/crm').LifecycleStage, number>;
  };
  return {
    total: payload.total,
    byStage: payload.by_stage,
  };
});

function mapLeadDetail(row: ApiLeadResponse): import('@/types/crm').LeadDetail {
  const base = mapLead(row);
  return {
    ...base,
    manualSource: row.manual_source ?? 'other',
    notes: row.notes ?? '',
    memberUserId: row.member_user_id ?? null,
    canMarkLost: row.can_mark_lost ?? false,
    timeline: row.timeline ?? [],
  };
}

export async function getLead(id: string): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(id)}`);
  if (response.status === 404) {
    throw new ApiError('Lead not found.', 404);
  }
  if (!response.ok) {
    throw new ApiError('Failed to load lead.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function createLeadContactEvent(
  id: string,
  input: { channel?: 'call'; outcome: import('@/types/crm').ContactOutcome; notes?: string }
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(id)}/contact-events`, {
    method: 'POST',
    body: JSON.stringify({ channel: 'call', ...input }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to log call.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function markLeadLost(id: string, reason?: string): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(id)}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage: 'lost', ...(reason ? { reason } : {}) }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to mark lead as lost.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

type ApiProgramResponse = {
  id: string;
  slug: string;
  name: string;
};

type ApiCohortResponse = {
  id: string;
  name: string;
  capacity: number;
  enrolled_count: number;
  waitlist_count: number;
  week_label: string;
  badge?: string;
  color: string;
};

type ApiCalendarResponse = {
  month: string;
  days: { day: number; label?: string; events: number }[];
};

type ApiEnrollmentResponse = {
  id: string;
  program_name: string;
  cohort_name: string;
  status: string;
  phase?: string | null;
  amount: string;
  date: string;
};

export async function listPrograms(): Promise<ApiProgramResponse[]> {
  const response = await requireApiFetch('/admin/programs');
  if (!response.ok) throw new ApiError('Failed to load programs.', response.status);
  return (await response.json()) as ApiProgramResponse[];
}

export async function getProgramCohorts(programId: string): Promise<import('@/types/crm').CohortCapacity[]> {
  const response = await requireApiFetch(`/admin/programs/${encodeURIComponent(programId)}/cohorts`);
  if (!response.ok) throw new ApiError('Failed to load cohorts.', response.status);
  const rows = (await response.json()) as ApiCohortResponse[];
  return rows.map((row) => ({
    name: row.name,
    color: row.color,
    week: row.week_label,
    enrolled: row.enrolled_count,
    cap: row.capacity,
    waitlist: row.waitlist_count,
    badge: row.badge,
  }));
}

export async function getProgramCalendar(month: string): Promise<ApiCalendarResponse> {
  const response = await requireApiFetch(`/admin/programs/calendar?month=${encodeURIComponent(month)}`);
  if (!response.ok) throw new ApiError('Failed to load program calendar.', response.status);
  return (await response.json()) as ApiCalendarResponse;
}

export async function getMemberEnrollments(userId: string): Promise<import('@/types/crm').ProgramHistoryItem[]> {
  const response = await requireApiFetch(`/admin/users/${encodeURIComponent(userId)}/enrollments`);
  if (!response.ok) throw new ApiError('Failed to load enrollments.', response.status);
  const rows = (await response.json()) as ApiEnrollmentResponse[];
  return rows.map((row) => ({
    program: row.program_name,
    batch: row.cohort_name,
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    amount: row.amount,
    date: row.date,
  }));
}

export type PromoStatus = 'active' | 'scheduled' | 'ended';

export type PromoListItem = {
  id: string;
  code: string;
  created_at: string;
  current_term_id?: string | null;
  discount_type?: string;
  discount_value?: number;
  applies_to?: string;
  program_slug?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  redemption_count: number;
  applied_count: number;
  redeemed_count: number;
  status: PromoStatus;
};

export type PromoTerm = {
  id: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  program_slug?: string | null;
  starts_at: string;
  ends_at?: string | null;
  redemption_count: number;
  applied_count: number;
  redeemed_count: number;
  status: PromoStatus;
};

export type PromoEvent = {
  id: string;
  event_type: string;
  occurred_at: string;
  term_id?: string | null;
  actor_user_id?: string | null;
  snapshot: Record<string, unknown>;
};

export type PromoUsage = {
  id: string;
  status: string;
  user_email: string;
  checkout_session_id: string;
  applied_at: string;
  redeemed_at?: string | null;
  discount_paise?: number | null;
  term_id: string;
};

export type PromoDetail = {
  id: string;
  code: string;
  description?: string | null;
  created_at: string;
  terms: PromoTerm[];
  events: PromoEvent[];
  usages: PromoUsage[];
  current_term?: PromoTerm | null;
  summary: PromoListItem;
};

export type CreatePromoInput = {
  code: string;
  description?: string | null;
  discount_type?: string;
  discount_value: number;
  applies_to?: string;
  program_slug?: string;
  starts_at: string;
  ends_at?: string | null;
};

export type PromoTermInput = {
  discount_type?: string;
  discount_value: number;
  applies_to?: string;
  program_slug?: string;
  starts_at: string;
  ends_at?: string | null;
};

async function parseApiError(response: Response, fallback: string): Promise<never> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new ApiError(payload?.error ?? fallback, response.status);
}

export async function listPromoCodes(): Promise<PromoListItem[]> {
  const response = await requireApiFetch('/admin/promo-codes');
  if (!response.ok) await parseApiError(response, 'Failed to load promo codes.');
  const payload = (await response.json()) as { items: PromoListItem[] };
  return payload.items;
}

export async function getPromoCode(id: string): Promise<PromoDetail> {
  const response = await requireApiFetch(`/admin/promo-codes/${encodeURIComponent(id)}`);
  if (!response.ok) await parseApiError(response, 'Failed to load promo code.');
  return response.json() as Promise<PromoDetail>;
}

export async function createPromoCode(input: CreatePromoInput): Promise<{ id: string; code: string }> {
  const response = await requireApiFetch('/admin/promo-codes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) await parseApiError(response, 'Failed to create promo code.');
  return response.json() as Promise<{ id: string; code: string }>;
}

export async function createPromoTerm(promoId: string, input: PromoTermInput): Promise<PromoTerm> {
  const response = await requireApiFetch(`/admin/promo-codes/${encodeURIComponent(promoId)}/terms`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) await parseApiError(response, 'Failed to create promo term.');
  return response.json() as Promise<PromoTerm>;
}

export async function deactivatePromoCode(promoId: string): Promise<PromoTerm> {
  const response = await requireApiFetch(`/admin/promo-codes/${encodeURIComponent(promoId)}/deactivate`, {
    method: 'POST',
  });
  if (!response.ok) await parseApiError(response, 'Failed to deactivate promo code.');
  return response.json() as Promise<PromoTerm>;
}

export async function deletePromoCode(promoId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/promo-codes/${encodeURIComponent(promoId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) await parseApiError(response, 'Failed to delete promo code.');
}

export async function updatePromoDescription(
  promoId: string,
  description: string | null
): Promise<{ id: string; description?: string | null }> {
  const response = await requireApiFetch(`/admin/promo-codes/${encodeURIComponent(promoId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
  if (!response.ok) await parseApiError(response, 'Failed to update description.');
  return response.json() as Promise<{ id: string; description?: string | null }>;
}
