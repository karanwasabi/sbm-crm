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
  marketing_contact_status?: import('@/types/crm').MarketingContactStatus;
  marketing_contact_synced_at?: string | null;
  marketing_unsubscribed_at?: string | null;
  manual_source?: import('@/types/crm').ManualLeadSource;
  notes?: string | null;
  member_user_id?: string | null;
  can_mark_lost?: boolean;
  payment_pending?: {
    checkout_session_id: string;
    program_name: string;
    cohort_name: string;
    amount_paise: number;
  } | null;
  timeline?: import('@/types/crm').TimelineEvent[];
  attribution?: {
    source: string;
    integration: string | null;
    campaign: string | null;
    form_id: string | null;
    platform: string | null;
    external_id: string | null;
  } | null;
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
    marketingContactStatus: row.marketing_contact_status ?? 'no_consent',
    marketingContactSyncedAt: row.marketing_contact_synced_at ?? null,
    marketingUnsubscribedAt: row.marketing_unsubscribed_at ?? null,
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

export async function listLeads(
  stage?: string,
  marketingContactStatus?: string
): Promise<import('@/types/crm').Lead[]> {
  const params = new URLSearchParams();
  if (stage && stage !== 'all') params.set('stage', stage);
  if (marketingContactStatus && marketingContactStatus !== 'all') {
    params.set('marketing_contact_status', marketingContactStatus);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
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
    paymentPending: row.payment_pending
      ? {
          checkoutSessionId: row.payment_pending.checkout_session_id,
          programName: row.payment_pending.program_name,
          cohortName: row.payment_pending.cohort_name,
          amountPaise: row.payment_pending.amount_paise,
        }
      : null,
    attribution: row.attribution
      ? {
          source: row.attribution.source,
          integration: row.attribution.integration,
          campaign: row.attribution.campaign,
          formId: row.attribution.form_id,
          platform: row.attribution.platform,
          externalId: row.attribution.external_id,
        }
      : null,
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
  program_id: string;
  name: string;
  starts_on: string;
  status: string;
  phase_label: string;
  member_count: number;
  can_edit: boolean;
  can_edit_starts_on: boolean;
  color: string;
};

type ApiCohortDetailResponse = ApiCohortResponse & {
  program_name: string;
  paid_member_count: number;
};

type ApiCohortMemberResponse = {
  enrollment_id: string;
  user_id: string;
  lead_id?: string | null;
  member_name: string;
  member_initials: string;
  email: string;
  enrollment_status: string;
  member_phase: string;
  subscription_state: 'active' | 'lapsed';
  subscription_status?: string;
  enrolled_at: string;
};

function mapCohortSummary(row: ApiCohortResponse): import('@/types/crm').CohortSummary {
  return {
    id: row.id,
    programId: row.program_id,
    name: row.name,
    startsOn: row.starts_on,
    status: row.status,
    phaseLabel: row.phase_label,
    memberCount: row.member_count,
    canEdit: row.can_edit,
    canEditStartsOn: row.can_edit_starts_on,
    color: row.color,
  };
}

function mapCohortDetail(row: ApiCohortDetailResponse): import('@/types/crm').CohortDetail {
  return {
    ...mapCohortSummary(row),
    programName: row.program_name,
    paidMemberCount: row.paid_member_count,
  };
}

function mapCohortMember(row: ApiCohortMemberResponse): import('@/types/crm').CohortMember {
  return {
    enrollmentId: row.enrollment_id,
    userId: row.user_id,
    leadId: row.lead_id ?? undefined,
    memberName: row.member_name,
    memberInitials: row.member_initials,
    email: row.email,
    enrollmentStatus: row.enrollment_status,
    memberPhase: row.member_phase,
    subscriptionState: row.subscription_state,
    subscriptionStatus: row.subscription_status,
    enrolledAt: row.enrolled_at,
  };
}

type ApiEnrollmentResponse = {
  id: string;
  program_name: string;
  cohort_name: string;
  status: string;
  phase?: string | null;
  amount: string;
  date: string;
  promo_code?: string | null;
};

export async function listPrograms(): Promise<ApiProgramResponse[]> {
  const response = await requireApiFetch('/admin/programs');
  if (!response.ok) throw new ApiError('Failed to load programs.', response.status);
  return (await response.json()) as ApiProgramResponse[];
}

export async function getProgramCohorts(programId: string): Promise<import('@/types/crm').CohortSummary[]> {
  const response = await requireApiFetch(`/admin/programs/${encodeURIComponent(programId)}/cohorts`);
  if (!response.ok) throw new ApiError('Failed to load cohorts.', response.status);
  const rows = (await response.json()) as ApiCohortResponse[];
  return rows.map(mapCohortSummary);
}

export async function getCohort(cohortId: string): Promise<import('@/types/crm').CohortDetail> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}`);
  if (!response.ok) throw new ApiError('Failed to load cohort.', response.status);
  return mapCohortDetail((await response.json()) as ApiCohortDetailResponse);
}

export async function getCohortMembers(cohortId: string): Promise<import('@/types/crm').CohortMember[]> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/members`);
  if (!response.ok) throw new ApiError('Failed to load cohort members.', response.status);
  const rows = (await response.json()) as ApiCohortMemberResponse[];
  return rows.map(mapCohortMember);
}

export type PatchCohortInput = {
  name?: string;
  starts_on?: string;
};

export async function patchCohort(
  cohortId: string,
  input: PatchCohortInput
): Promise<import('@/types/crm').CohortDetail> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update cohort.', response.status);
  }
  return mapCohortDetail((await response.json()) as ApiCohortDetailResponse);
}

export async function transferEnrollment(enrollmentId: string, targetCohortId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/enrollments/${encodeURIComponent(enrollmentId)}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_cohort_id: targetCohortId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to transfer member.', response.status);
  }
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
    promoCode: row.promo_code ?? null,
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

export async function updatePromoTerm(promoId: string, termId: string, input: PromoTermInput): Promise<PromoTerm> {
  const response = await requireApiFetch(
    `/admin/promo-codes/${encodeURIComponent(promoId)}/terms/${encodeURIComponent(termId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) await parseApiError(response, 'Failed to update promo term.');
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

type ApiRenewalSummaryResponse = {
  at_risk_count: number;
  at_risk_mrr_paise: number;
  cancelling_count: number;
  payment_issue_count: number;
  churned_count: number;
  churned_this_month: number;
  auto_renewed_this_month: number;
  healthy_count: number;
  next_cancelling_lead_id?: string | null;
  next_cancelling_name?: string | null;
  next_cancelling_access_at?: string | null;
};

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
  monthly_total_paise: number;
  lifetime_paid_paise: number;
  retention_bucket: import('@/types/crm').RenewalRetentionBucket;
  subscription_status: string;
  cancel_at_period_end: boolean;
  payment_method_summary?: string;
  risk: import('@/types/crm').RenewalRisk;
  days_until_charge?: number | null;
};

function mapRenewalSummary(row: ApiRenewalSummaryResponse): import('@/types/crm').RenewalSummary {
  return {
    atRiskCount: row.at_risk_count,
    atRiskMrrPaise: row.at_risk_mrr_paise,
    cancellingCount: row.cancelling_count,
    paymentIssueCount: row.payment_issue_count,
    churnedCount: row.churned_count,
    churnedThisMonth: row.churned_this_month,
    autoRenewedThisMonth: row.auto_renewed_this_month,
    healthyCount: row.healthy_count,
    nextCancellingLeadId: row.next_cancelling_lead_id,
    nextCancellingName: row.next_cancelling_name,
    nextCancellingAccessAt: row.next_cancelling_access_at,
  };
}

function mapRenewalRow(row: ApiRenewalRowResponse): import('@/types/crm').RenewalRow {
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
    monthlyTotalPaise: row.monthly_total_paise,
    lifetimePaidPaise: row.lifetime_paid_paise,
    retentionBucket: row.retention_bucket,
    subscriptionStatus: row.subscription_status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    paymentMethodSummary: row.payment_method_summary,
    risk: row.risk,
    daysUntilCharge: row.days_until_charge,
  };
}

export async function getRenewalSummary(): Promise<import('@/types/crm').RenewalSummary> {
  const response = await requireApiFetch('/admin/renewals/summary');
  if (!response.ok) throw new ApiError('Failed to load renewal summary.', response.status);
  const payload = (await response.json()) as ApiRenewalSummaryResponse;
  return mapRenewalSummary(payload);
}

export async function listRenewals(bucket?: string): Promise<import('@/types/crm').RenewalRow[]> {
  const query = bucket && bucket !== 'all' ? `?bucket=${encodeURIComponent(bucket)}` : '';
  const response = await requireApiFetch(`/admin/renewals${query}`);
  if (!response.ok) throw new ApiError('Failed to load renewals.', response.status);
  const payload = (await response.json()) as ApiRenewalRowResponse[];
  return payload.map(mapRenewalRow);
}

export async function getMetaIntegrationStatus(): Promise<import('@/types/crm').MetaIntegrationStatus> {
  const response = await requireApiFetch('/admin/integrations/meta/status');
  if (!response.ok) {
    throw new ApiError('Failed to load integration status.', response.status);
  }
  const payload = (await response.json()) as {
    connected: boolean;
    provider: string | null;
    webhook_configured: boolean;
    webhook_url: string;
    leads_today: number;
    last_sync_at: string | null;
    meta_leads_total: number;
    meta_leads_7d: number;
  };
  return {
    connected: payload.connected,
    provider: payload.provider,
    webhookConfigured: payload.webhook_configured,
    webhookUrl: payload.webhook_url,
    leadsToday: payload.leads_today,
    lastSyncAt: payload.last_sync_at,
    metaLeadsTotal: payload.meta_leads_total,
    metaLeads7d: payload.meta_leads_7d,
  };
}

export async function getMetaInboundLeads(limit = 20): Promise<import('@/types/crm').InboundLead[]> {
  const response = await requireApiFetch(`/admin/integrations/meta/inbound?limit=${limit}`);
  if (!response.ok) {
    throw new ApiError('Failed to load inbound leads.', response.status);
  }
  const rows = (await response.json()) as Array<{
    id: string;
    name: string;
    source: string;
    medium: string;
    campaign: string;
    time: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    source: row.source,
    medium: row.medium,
    campaign: row.campaign || '—',
    time: row.time,
  }));
}

export async function getSourcePerformance(): Promise<import('@/types/crm').SourcePerformanceRow[]> {
  const response = await requireApiFetch('/admin/analytics/source-performance');
  if (!response.ok) {
    throw new ApiError('Failed to load source performance.', response.status);
  }
  const payload = (await response.json()) as {
    rows: Array<{
      source: string;
      medium: import('@/types/crm').LeadMedium;
      leads: number;
      paid: number;
      cvr: number;
      cac: number | null;
    }>;
  };
  return payload.rows.map((row) => ({
    source: row.source,
    medium: row.medium,
    leads: row.leads,
    paid: row.paid,
    cvr: row.cvr,
    cac: row.cac,
  }));
}

export async function getDashboardAnalytics(): Promise<import('@/types/crm').DashboardAnalytics> {
  const response = await requireApiFetch('/admin/analytics/dashboard');
  if (!response.ok) {
    throw new ApiError('Failed to load dashboard analytics.', response.status);
  }
  const payload = (await response.json()) as {
    kpis: {
      new_leads_7d: number;
      new_leads_prev_7d: number;
      total_leads: number;
      conversion_rate: number;
      active_members: number;
      active_cohorts: number;
      revenue_mtd_paise: number;
      revenue_prev_mtd_paise: number;
      renewals_at_risk: number;
    };
    new_leads_sparkline: number[];
    funnel: Array<{ stage: string; label: string; count: number }>;
    revenue_weekly: Array<{ week_label: string; revenue_lakhs: number }>;
    geo: Array<{ label: string; count: number; pct: number }>;
  };
  return {
    kpis: {
      newLeads7d: payload.kpis.new_leads_7d,
      newLeadsPrev7d: payload.kpis.new_leads_prev_7d,
      totalLeads: payload.kpis.total_leads,
      conversionRate: payload.kpis.conversion_rate,
      activeMembers: payload.kpis.active_members,
      activeCohorts: payload.kpis.active_cohorts,
      revenueMtdPaise: payload.kpis.revenue_mtd_paise,
      revenuePrevMtdPaise: payload.kpis.revenue_prev_mtd_paise,
      renewalsAtRisk: payload.kpis.renewals_at_risk,
    },
    newLeadsSparkline: payload.new_leads_sparkline,
    funnel: payload.funnel,
    revenueWeekly: payload.revenue_weekly.map((row) => ({
      weekLabel: row.week_label,
      revenueLakhs: row.revenue_lakhs,
    })),
    geo: payload.geo,
  };
}

export async function importMetaLeadsCSV(file: File): Promise<import('@/types/crm').MetaCSVImportResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('Not authenticated.', 401);
  }

  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}/admin/leads/import-meta-csv`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach the backend. Is it running?', 503);
  }

  const payload = (await response.json().catch(() => null)) as {
    created?: number;
    skipped?: number;
    duplicate?: number;
    errors?: string[];
    error?: string;
  } | null;

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Failed to import leads.', response.status);
  }

  return {
    created: payload?.created ?? 0,
    skipped: payload?.skipped ?? 0,
    duplicate: payload?.duplicate ?? 0,
    errors: payload?.errors ?? [],
  };
}

export type EmailTemplate = {
  id: string;
  name: string;
  classification: 'transactional' | 'marketing';
  layout: 'simple' | 'hero' | 'cta' | 'two_column' | 'receipt' | 'digest';
  subject: string;
  contentJson: import('@/lib/email-template-types').GrapesProjectData;
  htmlCompiled: string;
  textCompiled: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type MarketingContactsSummary = {
  used: number;
  limit: number;
  percentUsed: number;
};

function mapEmailTemplate(row: {
  id: string;
  name: string;
  classification: string;
  layout: string;
  subject: string;
  content_json: unknown;
  html_compiled: string;
  text_compiled: string;
  status: string;
  created_at: string;
  updated_at: string;
}): EmailTemplate {
  const contentJson =
    row.content_json && typeof row.content_json === 'object' && !Array.isArray(row.content_json)
      ? (row.content_json as EmailTemplate['contentJson'])
      : {};

  return {
    id: row.id,
    name: row.name,
    classification: row.classification as EmailTemplate['classification'],
    layout: row.layout as EmailTemplate['layout'],
    subject: row.subject,
    contentJson,
    htmlCompiled: row.html_compiled,
    textCompiled: row.text_compiled,
    status: row.status as EmailTemplate['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await requireApiFetch('/admin/comms/templates');
  if (!response.ok) {
    throw new ApiError('Failed to load email templates.', response.status);
  }
  const rows = (await response.json()) as Parameters<typeof mapEmailTemplate>[0][];
  return rows.map(mapEmailTemplate);
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate> {
  const response = await requireApiFetch(`/admin/comms/templates/${id}`);
  if (!response.ok) {
    throw new ApiError('Failed to load email template.', response.status);
  }
  return mapEmailTemplate((await response.json()) as Parameters<typeof mapEmailTemplate>[0]);
}

export async function createEmailTemplate(input: {
  name: string;
  classification: EmailTemplate['classification'];
  layout: EmailTemplate['layout'];
  subject: string;
  contentJson: EmailTemplate['contentJson'];
  htmlCompiled: string;
  textCompiled: string;
  status: EmailTemplate['status'];
}): Promise<EmailTemplate> {
  const response = await requireApiFetch('/admin/comms/templates', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      classification: input.classification,
      layout: input.layout,
      subject: input.subject,
      content_json: input.contentJson,
      html_compiled: input.htmlCompiled,
      text_compiled: input.textCompiled,
      status: input.status,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to create template.', response.status);
  }
  return mapEmailTemplate((await response.json()) as Parameters<typeof mapEmailTemplate>[0]);
}

export async function updateEmailTemplate(
  id: string,
  input: {
    name: string;
    classification: EmailTemplate['classification'];
    layout: EmailTemplate['layout'];
    subject: string;
    contentJson: EmailTemplate['contentJson'];
    htmlCompiled: string;
    textCompiled: string;
    status: EmailTemplate['status'];
  }
): Promise<EmailTemplate> {
  const response = await requireApiFetch(`/admin/comms/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      classification: input.classification,
      layout: input.layout,
      subject: input.subject,
      content_json: input.contentJson,
      html_compiled: input.htmlCompiled,
      text_compiled: input.textCompiled,
      status: input.status,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update template.', response.status);
  }
  return mapEmailTemplate((await response.json()) as Parameters<typeof mapEmailTemplate>[0]);
}

export async function sendEmailTemplateTest(id: string, toEmail: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/templates/${id}/send-test`, {
    method: 'POST',
    body: JSON.stringify({ to_email: toEmail }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to send test email.', response.status);
  }
}

export async function sendLeadEmail(leadId: string, templateId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/leads/${leadId}/send`, {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to send email.', response.status);
  }
}

export const getMarketingContactsSummary = cache(async (): Promise<MarketingContactsSummary> => {
  const response = await requireApiFetch('/admin/comms/contacts/summary');
  if (!response.ok) {
    throw new ApiError('Failed to load marketing contact summary.', response.status);
  }
  const payload = (await response.json()) as {
    used: number;
    limit: number;
    percent_used: number;
  };
  return {
    used: payload.used,
    limit: payload.limit,
    percentUsed: payload.percent_used,
  };
});

export type CommsAnalyticsTotals = {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  failed: number;
  skipped: number;
};

export type CommsTemplatePerformance = {
  templateId?: string;
  templateName: string;
  classification: 'transactional' | 'marketing';
  sendCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  deliveredCount: number;
  clickedCount: number;
  openedCount: number;
  bouncedCount: number;
  openRate?: number;
  clickRate?: number;
};

export type CommsSendIssue = {
  id: string;
  templateId?: string;
  templateName: string;
  classification: string;
  recipientEmail: string;
  status: string;
  skipReason?: string;
  subjectRendered: string;
  createdAt: string;
  sentAt?: string;
};

export type CommsAnalytics = {
  totals: CommsAnalyticsTotals;
  templates: CommsTemplatePerformance[];
  recentIssues: CommsSendIssue[];
  webhookUrl: string;
  webhookEnabled: boolean;
};

export const getCommsAnalytics = cache(async (): Promise<CommsAnalytics> => {
  const response = await requireApiFetch('/admin/comms/analytics');
  if (!response.ok) {
    throw new ApiError('Failed to load email analytics.', response.status);
  }
  const payload = (await response.json()) as {
    totals: CommsAnalyticsTotals;
    templates: Array<{
      template_id?: string;
      template_name: string;
      classification: 'transactional' | 'marketing';
      send_count: number;
      sent_count: number;
      failed_count: number;
      skipped_count: number;
      delivered_count: number;
      clicked_count: number;
      opened_count: number;
      bounced_count: number;
      open_rate?: number;
      click_rate?: number;
    }>;
    recent_issues: Array<{
      id: string;
      template_id?: string;
      template_name: string;
      classification: string;
      recipient_email: string;
      status: string;
      skip_reason?: string;
      subject_rendered: string;
      created_at: string;
      sent_at?: string;
    }>;
    webhook_url: string;
    webhook_enabled: boolean;
  };

  return {
    totals: payload.totals,
    templates: payload.templates.map((row) => ({
      templateId: row.template_id,
      templateName: row.template_name,
      classification: row.classification,
      sendCount: row.send_count,
      sentCount: row.sent_count,
      failedCount: row.failed_count,
      skippedCount: row.skipped_count,
      deliveredCount: row.delivered_count,
      clickedCount: row.clicked_count,
      openedCount: row.opened_count,
      bouncedCount: row.bounced_count,
      openRate: row.open_rate,
      clickRate: row.click_rate,
    })),
    recentIssues: payload.recent_issues.map((row) => ({
      id: row.id,
      templateId: row.template_id,
      templateName: row.template_name,
      classification: row.classification,
      recipientEmail: row.recipient_email,
      status: row.status,
      skipReason: row.skip_reason,
      subjectRendered: row.subject_rendered,
      createdAt: row.created_at,
      sentAt: row.sent_at,
    })),
    webhookUrl: payload.webhook_url,
    webhookEnabled: payload.webhook_enabled,
  };
});

export type Automation = import('@/lib/automation-types').Automation;

function mapAutomation(row: {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: unknown;
  graph_json: unknown;
  status: string;
  graph_version: number;
  created_at: string;
  updated_at: string;
}): Automation {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    triggerType: row.trigger_type as Automation['triggerType'],
    triggerConfig:
      row.trigger_config && typeof row.trigger_config === 'object' && !Array.isArray(row.trigger_config)
        ? (row.trigger_config as Record<string, unknown>)
        : {},
    graphJson:
      row.graph_json && typeof row.graph_json === 'object' && !Array.isArray(row.graph_json)
        ? (row.graph_json as Automation['graphJson'])
        : { nodes: [], edges: [] },
    status: row.status as Automation['status'],
    graphVersion: row.graph_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAutomations(): Promise<Automation[]> {
  const response = await requireApiFetch('/admin/comms/automations');
  if (!response.ok) {
    throw new ApiError('Failed to load automations.', response.status);
  }
  const rows = (await response.json()) as Parameters<typeof mapAutomation>[0][];
  return rows.map(mapAutomation);
}

export async function getAutomation(id: string): Promise<Automation> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}`);
  if (!response.ok) {
    throw new ApiError('Failed to load automation.', response.status);
  }
  return mapAutomation((await response.json()) as Parameters<typeof mapAutomation>[0]);
}

export async function createAutomation(input: {
  name: string;
  description: string;
  triggerType: Automation['triggerType'];
  triggerConfig: Record<string, unknown>;
  graphJson: Automation['graphJson'];
  status: Automation['status'];
}): Promise<Automation> {
  const response = await requireApiFetch('/admin/comms/automations', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig,
      graph_json: input.graphJson,
      status: input.status,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to create automation.', response.status);
  }
  return mapAutomation((await response.json()) as Parameters<typeof mapAutomation>[0]);
}

export async function updateAutomation(
  id: string,
  input: {
    name: string;
    description: string;
    triggerType: Automation['triggerType'];
    triggerConfig: Record<string, unknown>;
    graphJson: Automation['graphJson'];
    status: Automation['status'];
  }
): Promise<Automation> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig,
      graph_json: input.graphJson,
      status: input.status,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update automation.', response.status);
  }
  return mapAutomation((await response.json()) as Parameters<typeof mapAutomation>[0]);
}

export async function activateAutomation(id: string): Promise<Automation> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}/activate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to activate automation.', response.status);
  }
  return mapAutomation((await response.json()) as Parameters<typeof mapAutomation>[0]);
}

export type AutomationValidationIssue = {
  node_id: string;
  message: string;
};

export type AutomationValidationResult = {
  valid: boolean;
  errors: AutomationValidationIssue[];
};

export async function validateAutomation(id: string): Promise<AutomationValidationResult> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}/validate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to validate automation.', response.status);
  }
  return (await response.json()) as AutomationValidationResult;
}

/** @deprecated Use activateAutomation */
export async function publishAutomation(id: string): Promise<Automation> {
  return activateAutomation(id);
}

export async function deactivateAutomation(id: string): Promise<Automation> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}/deactivate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to deactivate automation.', response.status);
  }
  return mapAutomation((await response.json()) as Parameters<typeof mapAutomation>[0]);
}

export async function deleteAutomation(id: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to delete automation.', response.status);
  }
}

export async function testAutomation(id: string, leadId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}/test`, {
    method: 'POST',
    body: JSON.stringify({ lead_id: leadId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to run automation test.', response.status);
  }
}

export async function listAutomationEnrollments(
  automationId: string
): Promise<import('@/lib/automation-types').AutomationEnrollment[]> {
  const response = await requireApiFetch(`/admin/comms/automations/${automationId}/enrollments`);
  if (!response.ok) {
    throw new ApiError('Failed to load enrollments.', response.status);
  }
  const rows = (await response.json()) as Array<{
    id: string;
    automation_id: string;
    lead_id: string;
    lead_name: string;
    lead_email: string;
    lifecycle_stage: string;
    status: string;
    current_node_id: string;
    next_run_at?: string;
    test_mode: boolean;
    enrolled_at: string;
    completed_at?: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    automationId: row.automation_id,
    leadId: row.lead_id,
    leadName: row.lead_name,
    leadEmail: row.lead_email,
    lifecycleStage: row.lifecycle_stage,
    status: row.status,
    currentNodeId: row.current_node_id,
    nextRunAt: row.next_run_at,
    testMode: row.test_mode,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
  }));
}
