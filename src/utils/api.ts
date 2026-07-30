import { cache } from 'react';
import type { StaffAccessRole } from '@/lib/access';
import { LOGIN_PRODUCT_CRM } from '@/lib/login-access';
import { buildLeadListSearchParams } from '@/lib/lead-list-query';
import { tagSlugToLabel } from '@/lib/lead-tags';
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
  roles: (StaffAccessRole | 'superadmin')[];
  promoted?: boolean;
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
  invite_redirect_to?: string;
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
  system_tags: string[];
  manual_tags: string[];
  tags: string[];
  enriched: boolean;
  dedup: boolean;
  phone_duplicate?: boolean;
  phone_duplicate_count?: number;
  added_at: string;
  updated_at?: string;
  marketing_contact_status?: import('@/types/crm').MarketingContactStatus;
  marketing_contact_synced_at?: string | null;
  marketing_unsubscribed_at?: string | null;
  unseen_suggestion_count?: number;
  source_label?: string;
  manual_source?: import('@/types/crm').ManualLeadSource;
  notes?: string | null;
  member_user_id?: string | null;
  member_kind?: 'renewal' | 'returnee' | null;
  can_mark_lost?: boolean;
  can_purge?: boolean;
  can_offline_enroll?: boolean;
  can_transfer_membership?: boolean;
  coach_name?: string | null;
  cohort_id?: string | null;
  payment_pending?: {
    checkout_session_id: string;
    program_name: string;
    cohort_name: string;
    amount_paise: number;
  } | null;
  timeline?: {
    id: string;
    kind: 'op' | 'comms';
    title: string;
    body?: string;
    meta: string;
    occurred_at?: string;
    color: string;
  }[];
  attribution?: {
    source: string;
    source_label: string;
    integration: string | null;
    campaign: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    utm_term: string | null;
    form_id: string | null;
    form_name: string | null;
    intake_form_title: string | null;
    intake_form_name: string | null;
    platform: string | null;
    external_id: string | null;
  } | null;
  field_suggestions?: {
    id: number;
    field: 'name' | 'phone' | 'city' | 'country';
    current_value: string;
    suggested_value: string;
    source: import('@/types/crm').FieldSuggestion['source'];
    source_label: string;
    contact_event_id?: number | null;
    editable: boolean;
    status: 'pending' | 'dismissed' | 'applied';
    last_seen_at: string;
    seen_at?: string | null;
  }[];
  contact_duplicates?: {
    link_id: number;
    other_lead_id: string;
    other_lead_name: string;
    other_lead_email: string;
    other_lead_phone: string;
    other_lead_stage: import('@/types/crm').LifecycleStage;
    match_type: 'phone' | 'email';
    match_value: string;
    is_paying_member: boolean;
  }[];
  manual_intake_records?: {
    id: number;
    recorded_at: string;
    mode: 'attach_inquiry' | 'profile';
    source_label: string;
    profile_name?: string;
    profile_email?: string;
    profile_phone?: string;
    profile_city?: string;
    profile_country?: string;
    name_entered?: string;
    email_entered?: string;
    phone_entered?: string;
    city_entered?: string;
    country_entered?: string;
    tags_added?: string[];
    profile_fields_updated?: string[];
    staff_notes?: string;
  }[];
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

type ApiIntakeFormResponse = {
  id: string;
  slug: string;
  name: string;
  title: string;
  description?: string | null;
  form_tag: string;
  extra_tags: string[];
  show_country: boolean;
  show_city: boolean;
  show_notes: boolean;
  status: 'active' | 'archived';
  public_url: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
};

function mapIntakeForm(row: ApiIntakeFormResponse): import('@/types/crm').IntakeForm {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    description: row.description ?? undefined,
    formTag: row.form_tag,
    extraTags: row.extra_tags ?? [],
    showCountry: row.show_country,
    showCity: row.show_city,
    showNotes: row.show_notes,
    status: row.status,
    publicUrl: row.public_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

export async function listIntakeForms(status?: 'active' | 'archived'): Promise<import('@/types/crm').IntakeForm[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await requireApiFetch(`/admin/intake-forms${query}`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load intake forms.');
  }
  const rows = (await response.json()) as ApiIntakeFormResponse[];
  return rows.map(mapIntakeForm);
}

export async function getIntakeForm(id: string): Promise<import('@/types/crm').IntakeForm> {
  const response = await requireApiFetch(`/admin/intake-forms/${encodeURIComponent(id)}`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load intake form.');
  }
  return mapIntakeForm((await response.json()) as ApiIntakeFormResponse);
}

export async function createIntakeForm(
  input: import('@/types/crm').UpsertIntakeFormInput
): Promise<import('@/types/crm').IntakeForm> {
  const response = await requireApiFetch('/admin/intake-forms', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to create intake form.');
  }
  return mapIntakeForm((await response.json()) as ApiIntakeFormResponse);
}

export async function updateIntakeForm(
  id: string,
  input: import('@/types/crm').UpsertIntakeFormInput
): Promise<import('@/types/crm').IntakeForm> {
  const response = await requireApiFetch(`/admin/intake-forms/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to update intake form.');
  }
  return mapIntakeForm((await response.json()) as ApiIntakeFormResponse);
}

export async function archiveIntakeForm(id: string): Promise<import('@/types/crm').IntakeForm> {
  const response = await requireApiFetch(`/admin/intake-forms/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to archive intake form.');
  }
  return mapIntakeForm((await response.json()) as ApiIntakeFormResponse);
}

export async function checkIntakeDuplicate(input: {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  country_code?: string;
  city?: string;
}): Promise<import('@/types/crm').IntakeDuplicateCheckResult> {
  const response = await requireApiFetch('/admin/leads/intake/check-duplicate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to check duplicate.', response.status);
  }
  const payload = (await response.json()) as {
    match_found: boolean;
    match_type?: 'email' | 'phone';
    existing?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      stage: import('@/types/crm').LifecycleStage;
      is_paying: boolean;
    };
    conflicts?: {
      field: string;
      current_value: string;
      intake_value: string;
      merge_allowed: boolean;
    }[];
    merge_options?: {
      profile_merge_allowed: boolean;
      allowed_fields: string[];
      attach_inquiry_only: boolean;
      block_reason?: string;
      target_is_paying_member: boolean;
    };
  };
  return {
    matchFound: payload.match_found,
    matchType: payload.match_type,
    existing: payload.existing
      ? {
          id: payload.existing.id,
          name: payload.existing.name,
          email: payload.existing.email,
          phone: payload.existing.phone,
          stage: payload.existing.stage,
          isPaying: payload.existing.is_paying,
        }
      : undefined,
    conflicts: payload.conflicts?.map((c) => ({
      field: c.field,
      currentValue: c.current_value,
      intakeValue: c.intake_value,
      mergeAllowed: c.merge_allowed,
    })),
    mergeOptions: payload.merge_options
      ? {
          profileMergeAllowed: payload.merge_options.profile_merge_allowed,
          allowedFields: payload.merge_options.allowed_fields,
          attachInquiryOnly: payload.merge_options.attach_inquiry_only,
          blockReason: payload.merge_options.block_reason,
          targetIsPayingMember: payload.merge_options.target_is_paying_member,
        }
      : undefined,
  };
}

export async function mergeIntakeLead(input: {
  target_lead_id: string;
  mode: 'profile' | 'attach_inquiry';
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  country_code?: string;
  city?: string;
  manual_source: import('@/types/crm').ManualLeadSource;
  manual_tags?: string[];
  notes?: string;
  apply_fields?: string[];
}): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch('/admin/leads/intake/merge', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to merge lead.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function applyLeadFieldSuggestion(
  leadId: string,
  suggestionId: number
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/suggestions/${suggestionId}/apply`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to apply suggestion.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function applyManualIntakeSnapshot(
  leadId: string,
  eventId: number,
  field: 'name' | 'phone' | 'city' | 'country'
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/manual-intake/${eventId}/apply-snapshot`,
    { method: 'POST', body: JSON.stringify({ field }) }
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to apply profile value.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function applyManualIntakeSubmitted(
  leadId: string,
  eventId: number,
  field: 'name' | 'phone' | 'city' | 'country'
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/manual-intake/${eventId}/apply-submitted`,
    { method: 'POST', body: JSON.stringify({ field }) }
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to apply inquiry value.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function dismissLeadFieldSuggestion(
  leadId: string,
  suggestionId: number
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/suggestions/${suggestionId}/dismiss`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to dismiss suggestion.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function markLeadFieldSuggestionsSeen(leadId: string): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/suggestions/mark-seen`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to mark suggestions seen.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function dismissLeadContactDuplicate(
  leadId: string,
  linkId: number
): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/contact-duplicates/${linkId}/dismiss`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to dismiss duplicate link.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export async function listLeads(
  filters: import('@/lib/lead-database-url').LeadDatabaseFilters
): Promise<import('@/types/crm').LeadListResult> {
  const params = buildLeadListSearchParams(filters);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await requireApiFetch(`/admin/leads${query}`);
  if (!response.ok) {
    throw new ApiError('Failed to load leads.', response.status);
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

export async function getLeadFilterOptions(): Promise<import('@/types/crm').LeadFilterOptions> {
  const response = await requireApiFetch('/admin/leads/filter-options');
  if (!response.ok) {
    throw new ApiError('Failed to load lead filter options.', response.status);
  }
  const payload = (await response.json()) as {
    programs: { value: string; count: number }[];
    batches: { value: string; count: number }[];
    geography: { value: string; count: number }[];
    sources: { value: string; count: number }[];
    coaches?: { value: string; label?: string; count: number }[];
  };
  return {
    programs: payload.programs ?? [],
    batches: payload.batches ?? [],
    geography: payload.geography ?? [],
    sources: payload.sources ?? [],
    coaches: (payload.coaches ?? []).map((row) => ({
      value: row.value,
      label: row.label,
      count: row.count,
    })),
  };
}

export async function listTagSuggestions(): Promise<import('@/types/crm').TagSuggestion[]> {
  const response = await requireApiFetch('/admin/tags');
  if (!response.ok) {
    throw new ApiError('Failed to load tags.', response.status);
  }
  const tags = (await response.json()) as import('@/types/crm').TagSuggestion[];
  return tags.map((tag) => ({
    slug: tag.slug,
    label: tagSlugToLabel(tag.slug),
  }));
}

export async function updateLeadTags(leadId: string, manualTags: string[]): Promise<import('@/types/crm').LeadDetail> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/tags`, {
    method: 'PATCH',
    body: JSON.stringify({ manual_tags: manualTags }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update tags.', response.status);
  }
  return mapLeadDetail((await response.json()) as ApiLeadResponse);
}

export const getLeadSummary = cache(async (): Promise<import('@/types/crm').LeadSummary> => {
  const response = await requireApiFetch('/admin/leads/summary');
  if (!response.ok) {
    throw new ApiError('Failed to load lead summary.', response.status);
  }
  const payload = (await response.json()) as {
    total: number;
    by_stage: Record<import('@/types/crm').LifecycleStage, number>;
    with_unseen_suggestions?: number;
  };
  return {
    total: payload.total,
    byStage: payload.by_stage,
    withUnseenSuggestions: payload.with_unseen_suggestions ?? 0,
  };
});

function mapFieldSuggestions(
  rows: NonNullable<ApiLeadResponse['field_suggestions']>
): import('@/types/crm').FieldSuggestion[] {
  return rows.map((row) => ({
    id: row.id,
    field: row.field,
    currentValue: row.current_value,
    suggestedValue: row.suggested_value,
    source: row.source,
    sourceLabel: row.source_label,
    contactEventId: row.contact_event_id ?? null,
    editable: row.editable,
    status: row.status,
    lastSeenAt: row.last_seen_at,
    seenAt: row.seen_at ?? null,
  }));
}

function mapContactDuplicates(
  rows: NonNullable<ApiLeadResponse['contact_duplicates']>
): import('@/types/crm').ContactDuplicate[] {
  return rows.map((row) => ({
    linkId: row.link_id,
    otherLeadId: row.other_lead_id,
    otherLeadName: row.other_lead_name,
    otherLeadEmail: row.other_lead_email,
    otherLeadPhone: row.other_lead_phone,
    otherLeadStage: row.other_lead_stage,
    matchType: row.match_type,
    matchValue: row.match_value,
    isPayingMember: row.is_paying_member,
  }));
}

function mapManualIntakeRecords(
  rows: NonNullable<ApiLeadResponse['manual_intake_records']>
): import('@/types/crm').ManualIntakeRecord[] {
  return rows.map((row) => ({
    id: row.id,
    recordedAt: row.recorded_at,
    mode: row.mode,
    sourceLabel: row.source_label,
    profileName: row.profile_name,
    profileEmail: row.profile_email,
    profilePhone: row.profile_phone,
    profileCity: row.profile_city,
    profileCountry: row.profile_country,
    nameEntered: row.name_entered,
    emailEntered: row.email_entered,
    phoneEntered: row.phone_entered,
    cityEntered: row.city_entered,
    countryEntered: row.country_entered,
    tagsAdded: row.tags_added,
    profileFieldsUpdated: row.profile_fields_updated,
    staffNotes: row.staff_notes,
  }));
}

function mapTimelineEvents(rows: NonNullable<ApiLeadResponse['timeline']>): import('@/types/crm').TimelineEvent[] {
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    meta: row.meta,
    occurredAt: row.occurred_at,
    color: row.color,
  }));
}

function mapLeadDetail(row: ApiLeadResponse): import('@/types/crm').LeadDetail {
  const base = mapLead(row);
  const manualSource =
    row.manual_source ?? (row.attribution?.source as import('@/types/crm').ManualLeadSource | undefined) ?? '';
  return {
    ...base,
    manualSource: manualSource as import('@/types/crm').ManualLeadSource,
    notes: row.notes ?? '',
    memberUserId: row.member_user_id ?? null,
    memberKind: row.member_kind === 'renewal' || row.member_kind === 'returnee' ? row.member_kind : null,
    canMarkLost: row.can_mark_lost ?? false,
    canPurge: row.can_purge ?? false,
    canOfflineEnroll: row.can_offline_enroll ?? false,
    canTransferMembership: row.can_transfer_membership ?? false,
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
          sourceLabel: row.attribution.source_label ?? row.attribution.source,
          integration: row.attribution.integration,
          campaign: row.attribution.campaign,
          utmSource: row.attribution.utm_source,
          utmMedium: row.attribution.utm_medium,
          utmCampaign: row.attribution.utm_campaign,
          utmContent: row.attribution.utm_content,
          utmTerm: row.attribution.utm_term,
          formId: row.attribution.form_id,
          metaFormName: row.attribution.form_name,
          intakeFormTitle: row.attribution.intake_form_title,
          intakeFormName: row.attribution.intake_form_name,
          platform: row.attribution.platform,
          externalId: row.attribution.external_id,
        }
      : null,
    fieldSuggestions: row.field_suggestions ? mapFieldSuggestions(row.field_suggestions) : [],
    contactDuplicates: row.contact_duplicates ? mapContactDuplicates(row.contact_duplicates) : [],
    manualIntakeRecords: row.manual_intake_records ? mapManualIntakeRecords(row.manual_intake_records) : [],
    timeline: row.timeline ? mapTimelineEvents(row.timeline) : [],
    coachName: row.coach_name?.trim() || null,
    cohortId: row.cohort_id?.trim() || null,
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

import type { OfflineEnrollCohort } from '@/types/crm';

export type OfflineEnrollResult = {
  enrollmentId: string;
  cohortName: string;
  programName: string;
  inviteSent: boolean;
  stage: string;
};

export async function listOfflineEnrollCohorts(): Promise<OfflineEnrollCohort[]> {
  const response = await requireApiFetch('/admin/offline-enroll/cohorts');
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load cohorts.', response.status);
  }
  const rows = (await response.json()) as { id: string; name: string; starts_on: string }[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startsOn: row.starts_on,
  }));
}

export async function offlineEnrollLead(leadId: string, cohortId: string): Promise<OfflineEnrollResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/offline-enroll`, {
    method: 'POST',
    body: JSON.stringify({ cohort_id: cohortId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to enroll lead.', response.status);
  }
  const row = (await response.json()) as {
    enrollment_id: string;
    cohort_name: string;
    program_name: string;
    invite_sent: boolean;
    stage: string;
  };
  return {
    enrollmentId: row.enrollment_id,
    cohortName: row.cohort_name,
    programName: row.program_name,
    inviteSent: row.invite_sent,
    stage: row.stage,
  };
}

type ApiMembershipTransferOverwriteCandidate = {
  current: string | null;
  proposed: string;
  conflict: boolean;
};

type ApiMembershipTransferPreviewResponse = {
  donor: {
    lead_id: string;
    user_id: string | null;
    enrollment_id: string | null;
    cohort_id: string | null;
    cohort_name: string | null;
    access_until: string | null;
    razorpay_customer_ids?: string[];
  };
  match: import('@/types/crm').MembershipTransferMatch;
  overwrite_candidates: {
    first_name: ApiMembershipTransferOverwriteCandidate;
    last_name: ApiMembershipTransferOverwriteCandidate;
    email: ApiMembershipTransferOverwriteCandidate;
    whatsapp: ApiMembershipTransferOverwriteCandidate;
  };
  razorpay_conflict?: {
    customer_id: string;
    status: 'idle' | 'live';
    resolve_required: boolean;
    message?: string | null;
  } | null;
  blocking_errors?: string[];
  can_apply: boolean;
};

type ApiMembershipTransferApplyResponse = {
  status: 'transferred' | 'failed';
  donor_lead_id?: string;
  recipient_lead_id?: string;
  rolled_back?: boolean;
  error?: string | null;
  razorpay?: {
    status: string;
    customer_ids?: string[];
    parked_customer_id?: string | null;
  } | null;
  razorpay_conflict?: {
    customer_id: string;
    status: 'idle' | 'live';
    resolve_required: boolean;
    message?: string | null;
  } | null;
  razorpay_errors?: string[];
};

function mapOverwriteCandidate(
  row: ApiMembershipTransferOverwriteCandidate
): import('@/types/crm').MembershipTransferOverwriteCandidate {
  return {
    current: row.current,
    proposed: row.proposed,
    conflict: row.conflict,
  };
}

function mapRazorpayConflict(
  row: NonNullable<ApiMembershipTransferPreviewResponse['razorpay_conflict']>
): import('@/types/crm').MembershipTransferRazorpayConflict {
  return {
    customerId: row.customer_id,
    status: row.status,
    resolveRequired: row.resolve_required,
    message: row.message ?? null,
  };
}

function mapMembershipTransferPreview(
  row: ApiMembershipTransferPreviewResponse
): import('@/types/crm').MembershipTransferPreviewResponse {
  return {
    donor: {
      leadId: row.donor.lead_id,
      userId: row.donor.user_id,
      enrollmentId: row.donor.enrollment_id,
      cohortId: row.donor.cohort_id,
      cohortName: row.donor.cohort_name,
      accessUntil: row.donor.access_until,
      razorpayCustomerIds: row.donor.razorpay_customer_ids ?? [],
    },
    match: row.match,
    overwriteCandidates: {
      first_name: mapOverwriteCandidate(row.overwrite_candidates.first_name),
      last_name: mapOverwriteCandidate(row.overwrite_candidates.last_name),
      email: mapOverwriteCandidate(row.overwrite_candidates.email),
      whatsapp: mapOverwriteCandidate(row.overwrite_candidates.whatsapp),
    },
    razorpayConflict: row.razorpay_conflict ? mapRazorpayConflict(row.razorpay_conflict) : null,
    blockingErrors: row.blocking_errors ?? [],
    canApply: row.can_apply,
  };
}

function mapMembershipTransferApply(
  row: ApiMembershipTransferApplyResponse
): import('@/types/crm').MembershipTransferApplyResult {
  return {
    status: row.status,
    donorLeadId: row.donor_lead_id,
    recipientLeadId: row.recipient_lead_id,
    rolledBack: row.rolled_back,
    error: row.error ?? null,
    razorpay: row.razorpay
      ? {
          status: row.razorpay.status,
          customerIds: row.razorpay.customer_ids ?? [],
          parkedCustomerId: row.razorpay.parked_customer_id ?? null,
        }
      : null,
    razorpayConflict: row.razorpay_conflict ? mapRazorpayConflict(row.razorpay_conflict) : null,
    razorpayErrors: row.razorpay_errors ?? [],
  };
}

export async function previewMembershipTransfer(
  leadId: string,
  body: import('@/types/crm').MembershipTransferPreviewRequest
): Promise<import('@/types/crm').MembershipTransferPreviewResponse> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/membership-transfer/preview`, {
    method: 'POST',
    body: JSON.stringify({
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      whatsapp: body.whatsapp,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to preview membership transfer.', response.status);
  }
  return mapMembershipTransferPreview((await response.json()) as ApiMembershipTransferPreviewResponse);
}

export async function applyMembershipTransfer(
  leadId: string,
  body: import('@/types/crm').MembershipTransferApplyRequest
): Promise<import('@/types/crm').MembershipTransferApplyResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/membership-transfer`, {
    method: 'POST',
    body: JSON.stringify({
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      whatsapp: body.whatsapp,
      overwrite: body.overwrite,
      confirm_existing: body.confirmExisting,
      resolve_razorpay_conflict: body.resolveRazorpayConflict,
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiMembershipTransferApplyResponse
    | { error?: string }
    | null;
  if (!response.ok) {
    if (payload && typeof payload === 'object' && 'status' in payload && payload.status === 'failed') {
      return mapMembershipTransferApply(payload as ApiMembershipTransferApplyResponse);
    }
    throw new ApiError(
      (payload && 'error' in payload && typeof payload.error === 'string' ? payload.error : null) ??
        'Failed to transfer membership.',
      response.status
    );
  }
  return mapMembershipTransferApply(payload as ApiMembershipTransferApplyResponse);
}

export type LeadCheckoutSyncResult = {
  userId: string;
  enrolled: boolean;
  paymentPending: boolean;
};

export async function syncLeadCheckout(leadId: string): Promise<LeadCheckoutSyncResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/checkout/sync`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to sync checkout payment.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    enrolled: boolean;
    payment_pending: boolean;
  };
  return {
    userId: row.user_id,
    enrolled: row.enrolled,
    paymentPending: row.payment_pending,
  };
}

export type MarkCheckoutPaidOfflineResult = {
  userId: string;
  checkoutSessionId: string;
  enrollmentId: string;
  enrolled: boolean;
  paymentPending: boolean;
  stage: string;
};

export async function markLeadCheckoutPaidOffline(leadId: string): Promise<MarkCheckoutPaidOfflineResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/checkout/mark-paid-offline`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to mark checkout paid offline.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    checkout_session_id: string;
    enrollment_id: string;
    enrolled: boolean;
    payment_pending: boolean;
    stage?: string;
  };
  return {
    userId: row.user_id,
    checkoutSessionId: row.checkout_session_id,
    enrollmentId: row.enrollment_id,
    enrolled: row.enrolled,
    paymentPending: row.payment_pending,
    stage: row.stage ?? '',
  };
}

export type SetLeadPasswordResult = {
  userId: string;
  updated: boolean;
};

export async function setLeadPassword(leadId: string, password: string): Promise<SetLeadPasswordResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to set password.', response.status);
  }
  const row = (await response.json()) as { user_id: string; updated: boolean };
  return { userId: row.user_id, updated: row.updated };
}

export type VerifyLeadEmailResult = {
  userId: string;
  verified: boolean;
  alreadyVerified: boolean;
};

export async function verifyLeadEmail(leadId: string): Promise<VerifyLeadEmailResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/verify-email`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to verify email.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    verified: boolean;
    already_verified: boolean;
  };
  return {
    userId: row.user_id,
    verified: row.verified,
    alreadyVerified: row.already_verified,
  };
}

export type MemberServingsSnapshot = {
  protein: number;
  fiber: number;
  starch: number;
  dairy: number;
  fun: number;
  weightKgUsed: number;
};

export type ServingAddons = {
  protein: number;
  fiber: number;
  starch: number;
  dairy: number;
  fun: number;
};

export type HabitGoalAddons = {
  stepsDaily: number;
  exerciseDays: number;
  sleepHoursDaily: number;
  nutritionPointsDaily: number;
};

export type HabitGoalCaps = {
  stepsDailyMin: number | null;
  stepsDailyMax: number | null;
  exerciseDaysMin: number | null;
  exerciseDaysMax: number | null;
  sleepHoursDailyMin: number | null;
  sleepHoursDailyMax: number | null;
  nutritionPointsDailyMin: number | null;
  nutritionPointsDailyMax: number | null;
};

export type HabitGoalsSnapshot = {
  stepsDaily: number;
  exerciseDays: number;
  sleepHoursDaily: number;
  nutritionPointsDaily: number;
  stepsWeekly: number;
  sleepHoursWeekly: number;
  nutritionPointsWeekly: number;
};

export type MemberProfile = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  timezoneId: string | null;
  countryCode: string | null;
  city: string | null;
  mealPreference: string | null;
  whatsapp: string | null;
  heightCm: number | null;
  initialWeightKg: number | null;
  currentWeightKg: number | null;
  latestWeightSource: string | null;
  latestWeightLocalDate: string | null;
  onboardingCompletedAt: string | null;
  pointACompleted: boolean;
  pointACompletedAt: string | null;
  parentalConsent: boolean;
  notifyWhatsapp: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  soundsEnabled: boolean;
  servingAddons: ServingAddons;
  habitGoalAddons: HabitGoalAddons;
  habitGoalCaps: HabitGoalCaps;
  awaitingStart: boolean;
  programStartsOn: string | null;
  activeWeekStartDate: string | null;
  activeWeekServings: MemberServingsSnapshot | null;
  activeWeekGoals: HabitGoalsSnapshot | null;
};

export type NutritionRecalcResult = {
  userId: string;
  weekStartDate: string;
  awaitingStart: boolean;
  initialWeightKg: number | null;
  currentWeightKg: number | null;
  servings: MemberServingsSnapshot | null;
  mealPlansCleared: boolean;
};

function mapServings(
  row:
    | {
        protein: number;
        fiber: number;
        starch: number;
        dairy: number;
        fun: number;
        weight_kg_used: number;
      }
    | null
    | undefined
): MemberServingsSnapshot | null {
  if (!row) return null;
  return {
    protein: row.protein,
    fiber: row.fiber,
    starch: row.starch,
    dairy: row.dairy,
    fun: row.fun,
    weightKgUsed: row.weight_kg_used,
  };
}

export async function getLeadMemberProfile(leadId: string): Promise<MemberProfile> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/member-profile`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load member profile.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    sex: string | null;
    timezone_id: string | null;
    country_code: string | null;
    city: string | null;
    meal_preference: string | null;
    whatsapp: string | null;
    height_cm: number | null;
    initial_weight_kg: number | null;
    current_weight_kg: number | null;
    latest_weight_source: string | null;
    latest_weight_local_date: string | null;
    onboarding_completed_at: string | null;
    point_a_completed: boolean;
    point_a_completed_at: string | null;
    parental_consent: boolean;
    notify_whatsapp: boolean;
    notify_email: boolean;
    notify_push: boolean;
    sounds_enabled: boolean;
    serving_addons: {
      protein: number;
      fiber: number;
      starch: number;
      dairy: number;
      fun: number;
    };
    habit_goal_addons?: {
      steps_daily: number;
      exercise_days: number;
      sleep_hours_daily: number;
      nutrition_points_daily: number;
    };
    habit_goal_caps?: {
      steps_daily_min: number | null;
      steps_daily_max: number | null;
      exercise_days_min: number | null;
      exercise_days_max: number | null;
      sleep_hours_daily_min: number | null;
      sleep_hours_daily_max: number | null;
      nutrition_points_daily_min: number | null;
      nutrition_points_daily_max: number | null;
    };
    awaiting_start: boolean;
    program_starts_on: string | null;
    active_week_start_date: string | null;
    active_week_servings: {
      protein: number;
      fiber: number;
      starch: number;
      dairy: number;
      fun: number;
      weight_kg_used: number;
    } | null;
    active_week_goals?: {
      steps_daily: number;
      exercise_days: number;
      sleep_hours_daily: number;
      nutrition_points_daily: number;
      steps_weekly: number;
      sleep_hours_weekly: number;
      nutrition_points_weekly: number;
    } | null;
  };
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    timezoneId: row.timezone_id,
    countryCode: row.country_code,
    city: row.city,
    mealPreference: row.meal_preference,
    whatsapp: row.whatsapp,
    heightCm: row.height_cm,
    initialWeightKg: row.initial_weight_kg,
    currentWeightKg: row.current_weight_kg,
    latestWeightSource: row.latest_weight_source,
    latestWeightLocalDate: row.latest_weight_local_date,
    onboardingCompletedAt: row.onboarding_completed_at,
    pointACompleted: row.point_a_completed,
    pointACompletedAt: row.point_a_completed_at,
    parentalConsent: row.parental_consent,
    notifyWhatsapp: row.notify_whatsapp,
    notifyEmail: row.notify_email,
    notifyPush: row.notify_push,
    soundsEnabled: row.sounds_enabled,
    servingAddons: {
      protein: row.serving_addons?.protein ?? 0,
      fiber: row.serving_addons?.fiber ?? 0,
      starch: row.serving_addons?.starch ?? 0,
      dairy: row.serving_addons?.dairy ?? 0,
      fun: row.serving_addons?.fun ?? 0,
    },
    habitGoalAddons: {
      stepsDaily: row.habit_goal_addons?.steps_daily ?? 0,
      exerciseDays: row.habit_goal_addons?.exercise_days ?? 0,
      sleepHoursDaily: row.habit_goal_addons?.sleep_hours_daily ?? 0,
      nutritionPointsDaily: row.habit_goal_addons?.nutrition_points_daily ?? 0,
    },
    habitGoalCaps: {
      stepsDailyMin: row.habit_goal_caps?.steps_daily_min ?? null,
      stepsDailyMax: row.habit_goal_caps?.steps_daily_max ?? null,
      exerciseDaysMin: row.habit_goal_caps?.exercise_days_min ?? null,
      exerciseDaysMax: row.habit_goal_caps?.exercise_days_max ?? null,
      sleepHoursDailyMin: row.habit_goal_caps?.sleep_hours_daily_min ?? null,
      sleepHoursDailyMax: row.habit_goal_caps?.sleep_hours_daily_max ?? null,
      nutritionPointsDailyMin: row.habit_goal_caps?.nutrition_points_daily_min ?? null,
      nutritionPointsDailyMax: row.habit_goal_caps?.nutrition_points_daily_max ?? null,
    },
    awaitingStart: row.awaiting_start,
    programStartsOn: row.program_starts_on,
    activeWeekStartDate: row.active_week_start_date,
    activeWeekServings: mapServings(row.active_week_servings),
    activeWeekGoals: row.active_week_goals
      ? {
          stepsDaily: row.active_week_goals.steps_daily,
          exerciseDays: row.active_week_goals.exercise_days,
          sleepHoursDaily: row.active_week_goals.sleep_hours_daily,
          nutritionPointsDaily: row.active_week_goals.nutrition_points_daily,
          stepsWeekly: row.active_week_goals.steps_weekly,
          sleepHoursWeekly: row.active_week_goals.sleep_hours_weekly,
          nutritionPointsWeekly: row.active_week_goals.nutrition_points_weekly,
        }
      : null,
  };
}

export async function forceLeadNutritionRecalc(leadId: string): Promise<NutritionRecalcResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/force-nutrition-recalc`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to recalculate nutrition.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    week_start_date: string;
    awaiting_start: boolean;
    initial_weight_kg: number | null;
    current_weight_kg: number | null;
    servings: {
      protein: number;
      fiber: number;
      starch: number;
      dairy: number;
      fun: number;
      weight_kg_used: number;
    } | null;
    meal_plans_cleared: boolean;
  };
  return {
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    awaitingStart: row.awaiting_start,
    initialWeightKg: row.initial_weight_kg,
    currentWeightKg: row.current_weight_kg,
    servings: mapServings(row.servings),
    mealPlansCleared: row.meal_plans_cleared,
  };
}

export type ServingAddonsResult = {
  userId: string;
  servingAddons: ServingAddons;
  weekStartDate: string;
  servings: MemberServingsSnapshot | null;
  mealPlansCleared: boolean;
};

export type HabitGoalAddonsResult = {
  userId: string;
  habitGoalAddons: HabitGoalAddons;
  weekStartDate: string;
  goals: HabitGoalsSnapshot | null;
};

export type HabitGoalCapsResult = {
  userId: string;
  habitGoalCaps: HabitGoalCaps;
  weekStartDate: string;
  activeWeekGoals: HabitGoalsSnapshot | null;
};

export async function putLeadServingAddons(leadId: string, addons: ServingAddons): Promise<ServingAddonsResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/serving-addons`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      protein: addons.protein,
      fiber: addons.fiber,
      starch: addons.starch,
      dairy: addons.dairy,
      fun: addons.fun,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to save serving addons.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    serving_addons: ServingAddons;
    week_start_date: string;
    servings: {
      protein: number;
      fiber: number;
      starch: number;
      dairy: number;
      fun: number;
      weight_kg_used: number;
    } | null;
    meal_plans_cleared: boolean;
  };
  return {
    userId: row.user_id,
    servingAddons: {
      protein: row.serving_addons.protein,
      fiber: row.serving_addons.fiber,
      starch: row.serving_addons.starch,
      dairy: row.serving_addons.dairy,
      fun: row.serving_addons.fun,
    },
    weekStartDate: row.week_start_date,
    servings: mapServings(row.servings),
    mealPlansCleared: row.meal_plans_cleared,
  };
}

export async function putLeadHabitGoalAddons(leadId: string, addons: HabitGoalAddons): Promise<HabitGoalAddonsResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/habit-goal-addons`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      steps_daily: addons.stepsDaily,
      exercise_days: addons.exerciseDays,
      sleep_hours_daily: addons.sleepHoursDaily,
      nutrition_points_daily: addons.nutritionPointsDaily,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to save habit goal addons.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    habit_goal_addons: {
      steps_daily: number;
      exercise_days: number;
      sleep_hours_daily: number;
      nutrition_points_daily: number;
    };
    week_start_date: string;
    goals: {
      steps_daily: number;
      exercise_days: number;
      sleep_hours_daily: number;
      nutrition_points_daily: number;
      steps_weekly: number;
      sleep_hours_weekly: number;
      nutrition_points_weekly: number;
    } | null;
  };
  return {
    userId: row.user_id,
    habitGoalAddons: {
      stepsDaily: row.habit_goal_addons.steps_daily,
      exerciseDays: row.habit_goal_addons.exercise_days,
      sleepHoursDaily: row.habit_goal_addons.sleep_hours_daily,
      nutritionPointsDaily: row.habit_goal_addons.nutrition_points_daily,
    },
    weekStartDate: row.week_start_date,
    goals: row.goals
      ? {
          stepsDaily: row.goals.steps_daily,
          exerciseDays: row.goals.exercise_days,
          sleepHoursDaily: row.goals.sleep_hours_daily,
          nutritionPointsDaily: row.goals.nutrition_points_daily,
          stepsWeekly: row.goals.steps_weekly,
          sleepHoursWeekly: row.goals.sleep_hours_weekly,
          nutritionPointsWeekly: row.goals.nutrition_points_weekly,
        }
      : null,
  };
}

export async function putLeadHabitGoalCaps(leadId: string, caps: HabitGoalCaps): Promise<HabitGoalCapsResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/habit-goal-caps`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      steps_daily_min: caps.stepsDailyMin,
      steps_daily_max: caps.stepsDailyMax,
      exercise_days_min: caps.exerciseDaysMin,
      exercise_days_max: caps.exerciseDaysMax,
      sleep_hours_daily_min: caps.sleepHoursDailyMin,
      sleep_hours_daily_max: caps.sleepHoursDailyMax,
      nutrition_points_daily_min: caps.nutritionPointsDailyMin,
      nutrition_points_daily_max: caps.nutritionPointsDailyMax,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to save habit goal caps.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    habit_goal_caps: {
      steps_daily_min: number | null;
      steps_daily_max: number | null;
      exercise_days_min: number | null;
      exercise_days_max: number | null;
      sleep_hours_daily_min: number | null;
      sleep_hours_daily_max: number | null;
      nutrition_points_daily_min: number | null;
      nutrition_points_daily_max: number | null;
    };
    week_start_date: string;
    active_week_goals: {
      steps_daily: number;
      exercise_days: number;
      sleep_hours_daily: number;
      nutrition_points_daily: number;
      steps_weekly: number;
      sleep_hours_weekly: number;
      nutrition_points_weekly: number;
    } | null;
  };
  return {
    userId: row.user_id,
    habitGoalCaps: {
      stepsDailyMin: row.habit_goal_caps.steps_daily_min,
      stepsDailyMax: row.habit_goal_caps.steps_daily_max,
      exerciseDaysMin: row.habit_goal_caps.exercise_days_min,
      exerciseDaysMax: row.habit_goal_caps.exercise_days_max,
      sleepHoursDailyMin: row.habit_goal_caps.sleep_hours_daily_min,
      sleepHoursDailyMax: row.habit_goal_caps.sleep_hours_daily_max,
      nutritionPointsDailyMin: row.habit_goal_caps.nutrition_points_daily_min,
      nutritionPointsDailyMax: row.habit_goal_caps.nutrition_points_daily_max,
    },
    weekStartDate: row.week_start_date,
    activeWeekGoals: row.active_week_goals
      ? {
          stepsDaily: row.active_week_goals.steps_daily,
          exerciseDays: row.active_week_goals.exercise_days,
          sleepHoursDaily: row.active_week_goals.sleep_hours_daily,
          nutritionPointsDaily: row.active_week_goals.nutrition_points_daily,
          stepsWeekly: row.active_week_goals.steps_weekly,
          sleepHoursWeekly: row.active_week_goals.sleep_hours_weekly,
          nutritionPointsWeekly: row.active_week_goals.nutrition_points_weekly,
        }
      : null,
  };
}

export async function correctLeadWeights(
  leadId: string,
  initialWeightKg: number,
  currentWeightKg: number
): Promise<NutritionRecalcResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/correct-weights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initial_weight_kg: initialWeightKg,
      current_weight_kg: currentWeightKg,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to correct weights.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    week_start_date: string;
    awaiting_start: boolean;
    initial_weight_kg: number | null;
    current_weight_kg: number | null;
    servings: {
      protein: number;
      fiber: number;
      starch: number;
      dairy: number;
      fun: number;
      weight_kg_used: number;
    } | null;
    meal_plans_cleared: boolean;
  };
  return {
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    awaitingStart: row.awaiting_start,
    initialWeightKg: row.initial_weight_kg,
    currentWeightKg: row.current_weight_kg,
    servings: mapServings(row.servings),
    mealPlansCleared: row.meal_plans_cleared,
  };
}

export type CorrectHeightResult = {
  userId: string;
  heightCm: number;
  initialWeightKg: number | null;
  currentWeightKg: number | null;
  bmi: number | null;
};

export async function correctLeadHeight(leadId: string, heightCm: number): Promise<CorrectHeightResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/correct-height`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ height_cm: heightCm }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to correct height.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    height_cm: number;
    initial_weight_kg?: number | null;
    current_weight_kg?: number | null;
    bmi?: number | null;
  };
  return {
    userId: row.user_id,
    heightCm: row.height_cm,
    initialWeightKg: row.initial_weight_kg ?? null,
    currentWeightKg: row.current_weight_kg ?? null,
    bmi: row.bmi ?? null,
  };
}

export type CorrectTimezoneResult = {
  userId: string;
  timezoneId: string;
};

export async function correctLeadTimezone(leadId: string, timezoneId: string): Promise<CorrectTimezoneResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/correct-timezone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timezone_id: timezoneId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update timezone.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    timezone_id: string;
  };
  return {
    userId: row.user_id,
    timezoneId: row.timezone_id,
  };
}

export type ResetOnboardingPointAResult = {
  userId: string;
  onboardingCompletedAt: string | null;
  pointACompleted: boolean;
  weightLogsCleared: boolean;
  goalsCleared: boolean;
  servingsCleared: boolean;
  mealPlansCleared: boolean;
  pointAAssessmentCleared: boolean;
  pointALifestyleCleared: boolean;
};

export type PointAAssessment = {
  stepsPerDay: number | null;
  exerciseDaysPerWeek: number | null;
  sleepHours: number | null;
  nutritionAnswers: Record<string, string>;
  nutritionInitialScore: number | null;
  completed: boolean;
  completedAt: string | null;
  goalsRegenerated?: boolean;
  awaitingStart?: boolean;
  programWeekOffset?: number;
  firstCompleted?: boolean;
};

export type PutPointAAssessmentInput = {
  stepsPerDay: number;
  exerciseDaysPerWeek: number;
  sleepHours: number;
  nutritionAnswers: Record<string, string>;
};

function mapPointAAssessment(row: {
  steps_per_day: number | null;
  exercise_days_per_week: number | null;
  sleep_hours: number | null;
  nutrition_answers: Record<string, string> | null;
  nutrition_initial_score: number | null;
  completed: boolean;
  completed_at: string | null;
  goals_regenerated?: boolean;
  awaiting_start?: boolean;
  program_week_offset?: number;
  first_completed?: boolean;
}): PointAAssessment {
  return {
    stepsPerDay: row.steps_per_day,
    exerciseDaysPerWeek: row.exercise_days_per_week,
    sleepHours: row.sleep_hours,
    nutritionAnswers: row.nutrition_answers ?? {},
    nutritionInitialScore: row.nutrition_initial_score,
    completed: row.completed,
    completedAt: row.completed_at,
    goalsRegenerated: row.goals_regenerated,
    awaitingStart: row.awaiting_start,
    programWeekOffset: row.program_week_offset,
    firstCompleted: row.first_completed,
  };
}

export async function getLeadPointA(leadId: string): Promise<PointAAssessment> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/point-a`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load Point A assessment.', response.status);
  }
  const row = (await response.json()) as Parameters<typeof mapPointAAssessment>[0];
  return mapPointAAssessment(row);
}

export async function putLeadPointA(leadId: string, input: PutPointAAssessmentInput): Promise<PointAAssessment> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/point-a`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      steps_per_day: input.stepsPerDay,
      exercise_days_per_week: input.exerciseDaysPerWeek,
      sleep_hours: input.sleepHours,
      nutrition_answers: input.nutritionAnswers,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to save Point A assessment.', response.status);
  }
  const row = (await response.json()) as Parameters<typeof mapPointAAssessment>[0];
  return mapPointAAssessment(row);
}

export async function resetLeadOnboardingPointA(leadId: string): Promise<ResetOnboardingPointAResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/reset-onboarding-point-a`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to reset onboarding and Point A.', response.status);
  }
  const row = (await response.json()) as {
    user_id: string;
    onboarding_completed_at: string | null;
    point_a_completed: boolean;
    weight_logs_cleared: boolean;
    goals_cleared: boolean;
    servings_cleared: boolean;
    meal_plans_cleared: boolean;
    point_a_assessment_cleared: boolean;
    point_a_lifestyle_cleared: boolean;
  };
  return {
    userId: row.user_id,
    onboardingCompletedAt: row.onboarding_completed_at,
    pointACompleted: row.point_a_completed,
    weightLogsCleared: row.weight_logs_cleared,
    goalsCleared: row.goals_cleared,
    servingsCleared: row.servings_cleared,
    mealPlansCleared: row.meal_plans_cleared,
    pointAAssessmentCleared: row.point_a_assessment_cleared,
    pointALifestyleCleared: row.point_a_lifestyle_cleared,
  };
}

export type SetMembershipAccessResult = {
  enrollmentId: string;
  checkoutSessionId: string;
  accessUntil: string;
  graceUntil: string;
};

export async function setLeadMembershipAccessUntil(
  leadId: string,
  enrollmentId: string,
  accessUntil: string
): Promise<SetMembershipAccessResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/membership/access-until`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enrollment_id: enrollmentId, access_until: accessUntil }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update membership access.', response.status);
  }
  const row = (await response.json()) as {
    enrollment_id: string;
    checkout_session_id: string;
    access_until: string;
    grace_until: string;
  };
  return {
    enrollmentId: row.enrollment_id,
    checkoutSessionId: row.checkout_session_id,
    accessUntil: row.access_until,
    graceUntil: row.grace_until,
  };
}

export type SetMemberKindResult = {
  leadId: string;
  memberKind: 'renewal' | 'returnee' | null;
};

export async function setLeadMemberKind(
  leadId: string,
  memberKind: 'renewal' | 'returnee' | null
): Promise<SetMemberKindResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/member-kind`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_kind: memberKind }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update member kind.', response.status);
  }
  const row = (await response.json()) as {
    lead_id: string;
    member_kind: 'renewal' | 'returnee' | null;
  };
  return {
    leadId: row.lead_id,
    memberKind: row.member_kind === 'renewal' || row.member_kind === 'returnee' ? row.member_kind : null,
  };
}

export type PromoteToMemberResult = {
  enrollmentId: string;
  phase: string;
  stage?: string;
};

export async function promoteLeadToMember(leadId: string, enrollmentId: string): Promise<PromoteToMemberResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/membership/promote-to-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enrollment_id: enrollmentId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to promote to member.', response.status);
  }
  const row = (await response.json()) as {
    enrollment_id: string;
    phase: string;
    stage?: string;
  };
  return {
    enrollmentId: row.enrollment_id,
    phase: row.phase,
    stage: row.stage,
  };
}

export type DemoteToNewbieResult = {
  enrollmentId: string;
  phase: string;
  stage: string;
};

export async function demoteLeadToNewbie(leadId: string, enrollmentId: string): Promise<DemoteToNewbieResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/membership/demote-to-newbie`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enrollment_id: enrollmentId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to demote to newbie.', response.status);
  }
  const row = (await response.json()) as {
    enrollment_id: string;
    phase: string;
    stage: string;
  };
  return {
    enrollmentId: row.enrollment_id,
    phase: row.phase,
    stage: row.stage,
  };
}

export type LeadPurgeTestSignal = {
  rule: string;
  matched: boolean;
  detail?: string;
};

export type LeadPurgePreview = {
  lead_id: string;
  email: string;
  stage: string;
  member_user_id?: string | null;
  is_production: boolean;
  test_signals: LeadPurgeTestSignal[];
  has_test_signal: boolean;
  blockers: string[];
  checkout_sessions: number;
  razorpay_subscription_ids: string[];
  enrollment_count: number;
  invoice_count: number;
};

export type LeadPurgeInput = {
  confirmationEmail: string;
  reason: string;
};

export async function getLeadPurgePreview(id: string): Promise<LeadPurgePreview> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(id)}/purge-preview`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load purge preview.', response.status);
  }
  return (await response.json()) as LeadPurgePreview;
}

export async function purgeLead(id: string, input: LeadPurgeInput): Promise<{ audit_id: string; email: string }> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(id)}/purge`, {
    method: 'POST',
    body: JSON.stringify({
      confirmation_email: input.confirmationEmail,
      reason: input.reason,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to purge account.', response.status);
  }
  return (await response.json()) as { audit_id: string; email: string };
}

export type PurgeAuditListItem = {
  id: string;
  email: string;
  lead_id: string;
  user_id?: string | null;
  purged_by: string;
  purged_by_name: string;
  purged_at: string;
  environment: string;
  reason: string;
  outcome: 'completed' | 'failed' | 'partial';
  error_message?: string | null;
  total_paid_paise?: number;
  total_upfront_paise?: number;
  total_charged_paise?: number;
};

export type PurgeBillingCheckoutSnapshot = {
  checkout_session_id: string;
  upfront_total_paise: number;
  upfront_base_paise?: number;
  gst_paise?: number;
  paid_at?: string;
  program_name?: string;
  cohort_name?: string;
  access_until?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  promo_code?: string;
};

export type PurgeBillingChargeSnapshot = {
  razorpay_payment_id?: string;
  amount_paise: number;
  gst_paise?: number;
  status: string;
  charged_at?: string;
};

export type PurgeBillingSnapshot = {
  checkout_session_ids?: string[];
  enrollment_ids?: string[];
  invoice_numbers?: string[];
  total_charged_paise?: number;
  total_upfront_paise?: number;
  total_paid_paise?: number;
  checkouts?: PurgeBillingCheckoutSnapshot[];
  recurring_charges?: PurgeBillingChargeSnapshot[];
};

export type PurgeRazorpaySubscriptionSnapshot = {
  subscription_id: string;
  customer_id?: string;
  final_status: string;
  tokens_revoked?: string[];
};

export type PurgeRazorpaySnapshot = {
  subscription_ids?: string[];
  subscriptions?: PurgeRazorpaySubscriptionSnapshot[];
};

export type PurgeAuditDetail = PurgeAuditListItem & {
  force_override: boolean;
  test_signals: LeadPurgeTestSignal[];
  razorpay_snapshot: PurgeRazorpaySnapshot;
  billing_snapshot: PurgeBillingSnapshot;
};

export type PurgeAuditListResponse = {
  items: PurgeAuditListItem[];
  total: number;
  limit: number;
  offset: number;
};

export async function listPurgeAuditEvents(params?: {
  limit?: number;
  offset?: number;
}): Promise<PurgeAuditListResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.offset != null) search.set('offset', String(params.offset));
  const query = search.toString();
  const response = await requireApiFetch(`/admin/purge-events${query ? `?${query}` : ''}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load purge audit.', response.status);
  }
  return (await response.json()) as PurgeAuditListResponse;
}

export async function getPurgeAuditEvent(id: string): Promise<PurgeAuditDetail> {
  const response = await requireApiFetch(`/admin/purge-events/${encodeURIComponent(id)}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load purge event.', response.status);
  }
  const raw = (await response.json()) as Omit<
    PurgeAuditDetail,
    'test_signals' | 'razorpay_snapshot' | 'billing_snapshot'
  > & {
    test_signals: LeadPurgeTestSignal[] | unknown;
    razorpay_snapshot: PurgeRazorpaySnapshot | unknown;
    billing_snapshot: PurgeBillingSnapshot | unknown;
  };
  return {
    ...raw,
    test_signals: Array.isArray(raw.test_signals) ? raw.test_signals : [],
    razorpay_snapshot: (raw.razorpay_snapshot ?? {}) as PurgeRazorpaySnapshot,
    billing_snapshot: (raw.billing_snapshot ?? {}) as PurgeBillingSnapshot,
  };
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
  point_a_enabled?: boolean;
  point_a_effective?: boolean;
  can_edit_point_a_enabled?: boolean;
  is_demo?: boolean;
  can_edit_is_demo?: boolean;
  can_delete?: boolean;
  can_archive?: boolean;
  cleanup_blockers?: string[];
};

type ApiCohortMemberResponse = {
  enrollment_id: string;
  user_id: string;
  lead_id?: string | null;
  member_name: string;
  member_initials: string;
  email: string;
  whatsapp?: string | null;
  city?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  sex?: string | null;
  timezone_id?: string | null;
  timezone_label?: string | null;
  enrollment_status: string;
  member_phase: string;
  subscription_state: 'active' | 'lapsed' | 'transferred';
  subscription_status?: string;
  lifecycle_stage?: string | null;
  member_kind?: 'renewal' | 'returnee' | null;
  enrolled_at: string;
  onboarding_completed_at?: string | null;
  coach_user_id?: string | null;
  coach_name?: string | null;
  height_cm?: number | null;
  initial_weight_kg?: number | null;
  bmi?: number | null;
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
    pointAEnabled: row.point_a_enabled,
    pointAEffective: row.point_a_effective,
    canEditPointAEnabled: row.can_edit_point_a_enabled,
    isDemo: row.is_demo,
    canEditIsDemo: row.can_edit_is_demo,
    canDelete: row.can_delete,
    canArchive: row.can_archive,
    cleanupBlockers: row.cleanup_blockers,
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
    whatsapp: row.whatsapp?.trim() ?? '',
    city: row.city?.trim() ?? '',
    countryCode: row.country_code?.trim() ?? '',
    countryName: row.country_name?.trim() ?? '',
    sex: row.sex?.trim() || null,
    timezoneId: row.timezone_id?.trim() ?? '',
    timezoneLabel: row.timezone_label?.trim() || row.timezone_id?.trim() || '',
    enrollmentStatus: row.enrollment_status,
    memberPhase: row.member_phase,
    subscriptionState: row.subscription_state,
    subscriptionStatus: row.subscription_status,
    lifecycleStage: row.lifecycle_stage ?? undefined,
    memberKind: row.member_kind === 'renewal' || row.member_kind === 'returnee' ? row.member_kind : undefined,
    enrolledAt: row.enrolled_at,
    onboardingCompletedAt: row.onboarding_completed_at?.trim() || null,
    coachUserId: row.coach_user_id ?? null,
    coachName: row.coach_name ?? null,
    heightCm: row.height_cm ?? null,
    initialWeightKg: row.initial_weight_kg ?? null,
    bmi: row.bmi ?? null,
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
  starts_on?: string | null;
  access_until?: string | null;
  grace_until?: string | null;
  cancel_at_period_end?: boolean | null;
  subscription_status?: string | null;
  recurring_start_at?: string | null;
  drives_lifecycle?: boolean;
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

export async function patchCohortPointAEnabled(
  cohortId: string,
  pointAEnabled: boolean
): Promise<import('@/types/crm').CohortDetail> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/point-a-enabled`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ point_a_enabled: pointAEnabled }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update Point A setting.', response.status);
  }
  return mapCohortDetail((await response.json()) as ApiCohortDetailResponse);
}

export async function patchCohortIsDemo(
  cohortId: string,
  isDemo: boolean
): Promise<import('@/types/crm').CohortDetail> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/is-demo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_demo: isDemo }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update demo setting.', response.status);
  }
  return mapCohortDetail((await response.json()) as ApiCohortDetailResponse);
}

export async function lockCohort(cohortId: string): Promise<{ id: string; status: string; name: string }> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/lock`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to lock cohort.', response.status);
  }
  return (await response.json()) as { id: string; status: string; name: string };
}

export async function archiveCohort(cohortId: string): Promise<{ id: string; archived_at: string }> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/archive`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to archive cohort.', response.status);
  }
  return (await response.json()) as { id: string; archived_at: string };
}

export async function deleteCohort(cohortId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string; suggest?: string } | null;
    const message = payload?.error ?? 'Failed to delete cohort.';
    throw new ApiError(message, response.status);
  }
}

export async function assignCohortCoach(
  cohortId: string,
  input: { enrollment_ids: string[]; coach_user_id: string | null }
): Promise<{ updated: number }> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/members/assign-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to assign coach.', response.status);
  }
  return (await response.json()) as { updated: number };
}

export type CohortPushBroadcastPreview = {
  activeMembers: number;
  reachableMembers: number;
  skippedOptOut: number;
  skippedNoToken: number;
};

export type CohortPushBroadcastResult = CohortPushBroadcastPreview & {
  membersReached: number;
  devicesSent: number;
  staleRemoved: number;
};

export async function getCohortPushBroadcastPreview(
  cohortId: string,
  userIds?: string[]
): Promise<CohortPushBroadcastPreview> {
  const response =
    userIds && userIds.length > 0
      ? await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/push-broadcast/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: userIds }),
        })
      : await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/push-broadcast/preview`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load push broadcast preview.', response.status);
  }
  const row = (await response.json()) as {
    active_members: number;
    reachable_members: number;
    skipped_opt_out: number;
    skipped_no_token: number;
  };
  return {
    activeMembers: row.active_members,
    reachableMembers: row.reachable_members,
    skippedOptOut: row.skipped_opt_out,
    skippedNoToken: row.skipped_no_token,
  };
}

export async function sendCohortPushBroadcast(
  cohortId: string,
  input: { title: string; body: string; userIds?: string[] }
): Promise<CohortPushBroadcastResult> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/push-broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      ...(input.userIds && input.userIds.length > 0 ? { user_ids: input.userIds } : {}),
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    active_members?: number;
    reachable_members?: number;
    members_reached?: number;
    devices_sent?: number;
    stale_removed?: number;
    skipped_opt_out?: number;
    skipped_no_token?: number;
  } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Failed to send push broadcast.', response.status);
  }
  return {
    activeMembers: payload?.active_members ?? 0,
    reachableMembers: payload?.reachable_members ?? 0,
    skippedOptOut: payload?.skipped_opt_out ?? 0,
    skippedNoToken: payload?.skipped_no_token ?? 0,
    membersReached: payload?.members_reached ?? 0,
    devicesSent: payload?.devices_sent ?? 0,
    staleRemoved: payload?.stale_removed ?? 0,
  };
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
    id: row.id,
    program: row.program_name,
    batch: row.cohort_name,
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    amount: row.amount,
    date: row.date,
    promoCode: row.promo_code ?? null,
    phase: row.phase ?? null,
    startsOn: row.starts_on ?? null,
    accessUntil: row.access_until ?? null,
    graceUntil: row.grace_until ?? null,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? null,
    subscriptionStatus: row.subscription_status ?? null,
    recurringStartAt: row.recurring_start_at ?? null,
    drivesLifecycle: Boolean(row.drives_lifecycle),
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
    automation_available: boolean;
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
    automationAvailable: payload.automation_available,
    webhookConfigured: payload.webhook_configured,
    webhookUrl: payload.webhook_url,
    leadsToday: payload.leads_today,
    lastSyncAt: payload.last_sync_at,
    metaLeadsTotal: payload.meta_leads_total,
    metaLeads7d: payload.meta_leads_7d,
  };
}

export async function getRazorpayIntegrationStatus(): Promise<import('@/types/crm').RazorpayIntegrationStatus> {
  const response = await requireApiFetch('/admin/integrations/razorpay/status');
  if (!response.ok) {
    throw new ApiError('Failed to load Razorpay integration status.', response.status);
  }
  const payload = (await response.json()) as {
    configured: boolean;
    webhook_configured: boolean;
  };
  return {
    configured: payload.configured,
    webhookConfigured: payload.webhook_configured,
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

export async function getSourcePerformance(
  days?: number | 'all'
): Promise<import('@/types/crm').SourcePerformanceRow[]> {
  const query = days === undefined ? '' : `?days=${days === 'all' ? 'all' : Math.max(0, Math.trunc(days))}`;
  const response = await requireApiFetch(`/admin/analytics/source-performance${query}`);
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
      cpl: number | null;
      cac: number | null;
    }>;
  };
  return payload.rows.map((row) => ({
    source: row.source,
    medium: row.medium,
    leads: row.leads,
    paid: row.paid,
    cvr: row.cvr,
    cpl: row.cpl,
    cac: row.cac,
  }));
}

export async function getMetaCampaignPerformance(
  days?: number | 'all'
): Promise<import('@/types/crm').MetaCampaignPerformanceRow[]> {
  const query = days === undefined ? '' : `?days=${days === 'all' ? 'all' : Math.max(0, Math.trunc(days))}`;
  const response = await requireApiFetch(`/admin/integrations/meta/campaign-performance${query}`);
  if (!response.ok) {
    throw new ApiError('Failed to load campaign performance.', response.status);
  }
  const payload = (await response.json()) as {
    rows: Array<{
      campaign_id: string;
      campaign_name: string;
      leads: number;
      paid: number;
      spend: number | null;
      cvr: number;
      cpl: number | null;
      cac: number | null;
    }>;
  };
  return payload.rows.map((row) => ({
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    leads: row.leads,
    paid: row.paid,
    spend: row.spend,
    cvr: row.cvr,
    cpl: row.cpl,
    cac: row.cac,
  }));
}

export async function getAdPerformance(days?: number | 'all'): Promise<import('@/types/crm').AdPerformanceRow[]> {
  const query = days === undefined ? '' : `?days=${days === 'all' ? 'all' : Math.max(0, Math.trunc(days))}`;
  const response = await requireApiFetch(`/admin/analytics/ad-performance${query}`);
  if (!response.ok) {
    throw new ApiError('Failed to load ad performance.', response.status);
  }
  const payload = (await response.json()) as {
    rows: Array<{
      ad_content: string;
      adset: string;
      program: string;
      campaign: string;
      leads: number;
      paid: number;
      cvr: number;
    }>;
  };
  return payload.rows.map((row) => ({
    adContent: row.ad_content,
    adset: row.adset,
    program: row.program,
    campaign: row.campaign,
    leads: row.leads,
    paid: row.paid,
    cvr: row.cvr,
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

export type EmailTemplate = {
  id: string;
  name: string;
  classification: 'transactional' | 'marketing';
  layout: 'simple' | 'hero' | 'cta' | 'two_column' | 'receipt' | 'digest';
  subject: string;
  fromName?: string | null;
  fromLocalPart?: string | null;
  contentJson: import('@/lib/email-template-types').GrapesProjectData;
  htmlCompiled: string;
  textCompiled: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type MarketingContactsSummary = {
  used: number;
  activeSubscribers: number;
  limit: number;
  percentUsed: number;
  source: 'resend' | 'local';
};

function mapEmailTemplate(row: {
  id: string;
  name: string;
  classification: string;
  layout: string;
  subject: string;
  from_name?: string | null;
  from_local_part?: string | null;
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
    fromName: row.from_name ?? null,
    fromLocalPart: row.from_local_part ?? null,
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
  fromName?: string | null;
  fromLocalPart?: string | null;
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
      from_name: input.fromName ?? '',
      from_local_part: input.fromLocalPart ?? '',
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
    fromName?: string | null;
    fromLocalPart?: string | null;
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
      from_name: input.fromName ?? '',
      from_local_part: input.fromLocalPart ?? '',
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

export type BulkLeadEmailPreview = {
  template_id: string;
  classification: 'transactional' | 'marketing';
  selected: number;
  will_send: number;
  already_sent: number;
  will_send_if_skip_duplicates: number;
  skipped: {
    no_consent: number;
    unsubscribed: number;
    no_email: number;
    marketing_contact_cap: number;
    already_sent: number;
  };
};

export type BulkLeadEmailSendJob = {
  id: string;
  template_id: string;
  template_name?: string;
  template_classification?: 'transactional' | 'marketing';
  sent_by_name?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  selected: number;
  sent: number;
  skipped: number;
  failed: number;
  skip_breakdown: BulkLeadEmailPreview['skipped'];
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type BulkLeadEmailSendRow = {
  id: string;
  lead_id?: string;
  recipient_email: string;
  subject_rendered: string;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  skip_reason?: string;
  created_at: string;
  sent_at?: string | null;
};

export type BulkLeadEmailSendList = {
  items: BulkLeadEmailSendRow[];
  total: number;
};

export async function previewBulkLeadEmailSend(templateId: string, leadIds: string[]): Promise<BulkLeadEmailPreview> {
  const response = await requireApiFetch('/admin/comms/leads/bulk-send/preview', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId, lead_ids: leadIds }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to preview bulk send.', response.status);
  }
  return (await response.json()) as BulkLeadEmailPreview;
}

export async function startBulkLeadEmailSend(
  templateId: string,
  leadIds: string[],
  options?: { skipAlreadySent?: boolean }
): Promise<{ job_id: string }> {
  const response = await requireApiFetch('/admin/comms/leads/bulk-send', {
    method: 'POST',
    body: JSON.stringify({
      template_id: templateId,
      lead_ids: leadIds,
      skip_already_sent: options?.skipAlreadySent ?? false,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to start bulk send.', response.status);
  }
  return (await response.json()) as { job_id: string };
}

export async function getBulkLeadEmailSendJob(jobId: string): Promise<BulkLeadEmailSendJob> {
  const response = await requireApiFetch(`/admin/comms/bulk-send/${encodeURIComponent(jobId)}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load bulk send job.', response.status);
  }
  const row = (await response.json()) as BulkLeadEmailSendJob;
  return row;
}

export async function listBulkLeadEmailSendJobs(limit = 50): Promise<BulkLeadEmailSendJob[]> {
  const response = await requireApiFetch(`/admin/comms/bulk-send?limit=${encodeURIComponent(String(limit))}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to list bulk send jobs.', response.status);
  }
  return (await response.json()) as BulkLeadEmailSendJob[];
}

export async function listBulkLeadEmailSendJobSends(
  jobId: string,
  options?: { limit?: number; offset?: number }
): Promise<BulkLeadEmailSendList> {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset != null) {
    params.set('offset', String(options.offset));
  }
  const query = params.toString();
  const response = await requireApiFetch(
    `/admin/comms/bulk-send/${encodeURIComponent(jobId)}/sends${query ? `?${query}` : ''}`
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load bulk send recipients.', response.status);
  }
  return (await response.json()) as BulkLeadEmailSendList;
}

export type WhatsAppTemplate = {
  id: string;
  convoniteId?: string;
  name: string;
  status: import('@/lib/whatsapp-template-types').WhatsAppTemplateStatus;
  category: import('@/lib/whatsapp-template-types').WhatsAppTemplateCategory;
  language: string;
  purpose: import('@/lib/whatsapp-template-types').WhatsAppTemplatePurpose;
  runtimeParams: unknown;
  content: unknown;
  liveContent?: unknown | null;
  rating?: string;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapWhatsAppTemplate(row: {
  id: string;
  convonite_id?: string;
  name: string;
  status: string;
  category: string;
  language: string;
  purpose: string;
  runtime_params: unknown;
  content: unknown;
  live_content?: unknown;
  rating?: string;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}): WhatsAppTemplate {
  return {
    id: row.id,
    convoniteId: row.convonite_id,
    name: row.name,
    status: row.status as WhatsAppTemplate['status'],
    category: row.category as WhatsAppTemplate['category'],
    language: row.language,
    purpose: row.purpose as WhatsAppTemplate['purpose'],
    runtimeParams: row.runtime_params ?? [],
    content: row.content ?? {},
    liveContent: row.live_content ?? null,
    rating: row.rating,
    lastSyncedAt: row.last_synced_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type WhatsAppFlags = {
  templatesEnabled: boolean;
  sendsEnabled: boolean;
};

export async function getWhatsAppFlags(): Promise<WhatsAppFlags> {
  const response = await requireApiFetch('/admin/comms/whatsapp/flags');
  if (!response.ok) {
    throw new ApiError('Failed to load WhatsApp settings.', response.status);
  }
  const row = (await response.json()) as { templates_enabled: boolean; sends_enabled: boolean };
  return {
    templatesEnabled: row.templates_enabled,
    sendsEnabled: row.sends_enabled,
  };
}

export async function listWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const response = await requireApiFetch('/admin/comms/whatsapp/templates');
  if (!response.ok) {
    throw new ApiError('Failed to load WhatsApp templates.', response.status);
  }
  const rows = (await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0][];
  return rows.map(mapWhatsAppTemplate);
}

export async function getWhatsAppTemplate(id: string): Promise<WhatsAppTemplate> {
  const response = await requireApiFetch(`/admin/comms/whatsapp/templates/${id}`);
  if (!response.ok) {
    throw new ApiError('Failed to load WhatsApp template.', response.status);
  }
  return mapWhatsAppTemplate((await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0]);
}

export async function createWhatsAppTemplate(input: {
  name: string;
  category: WhatsAppTemplate['category'];
  language: string;
  purpose: WhatsAppTemplate['purpose'];
  runtimeParams: unknown;
  content: unknown;
}): Promise<WhatsAppTemplate> {
  const response = await requireApiFetch('/admin/comms/whatsapp/templates', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      language: input.language,
      purpose: input.purpose,
      runtime_params: input.runtimeParams,
      content: input.content,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to create WhatsApp template.', response.status);
  }
  return mapWhatsAppTemplate((await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0]);
}

export async function updateWhatsAppTemplate(
  id: string,
  input: {
    name: string;
    category: WhatsAppTemplate['category'];
    language: string;
    purpose: WhatsAppTemplate['purpose'];
    runtimeParams: unknown;
    content: unknown;
  }
): Promise<WhatsAppTemplate> {
  const response = await requireApiFetch(`/admin/comms/whatsapp/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      language: input.language,
      purpose: input.purpose,
      runtime_params: input.runtimeParams,
      content: input.content,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to update WhatsApp template.', response.status);
  }
  return mapWhatsAppTemplate((await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0]);
}

async function postWhatsAppTemplateAction(
  id: string,
  action: 'submit' | 'activate' | 'deactivate'
): Promise<WhatsAppTemplate> {
  const response = await requireApiFetch(`/admin/comms/whatsapp/templates/${id}/${action}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Failed to ${action} WhatsApp template.`, response.status);
  }
  return mapWhatsAppTemplate((await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0]);
}

export function submitWhatsAppTemplate(id: string): Promise<WhatsAppTemplate> {
  return postWhatsAppTemplateAction(id, 'submit');
}

export function activateWhatsAppTemplate(id: string): Promise<WhatsAppTemplate> {
  return postWhatsAppTemplateAction(id, 'activate');
}

export function deactivateWhatsAppTemplate(id: string): Promise<WhatsAppTemplate> {
  return postWhatsAppTemplateAction(id, 'deactivate');
}

export async function syncWhatsAppTemplates(): Promise<{ synced: number }> {
  const response = await requireApiFetch('/admin/comms/whatsapp/templates/sync', {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to sync WhatsApp templates.', response.status);
  }
  return (await response.json()) as { synced: number };
}

export async function sendWhatsAppTemplateTest(id: string, toPhone: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/whatsapp/templates/${id}/send-test`, {
    method: 'POST',
    body: JSON.stringify({ to_phone: toPhone }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to send test WhatsApp.', response.status);
  }
}

export async function sendLeadWhatsApp(leadId: string, templateId: string): Promise<void> {
  const response = await requireApiFetch(`/admin/comms/leads/${leadId}/whatsapp/send`, {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to send WhatsApp.', response.status);
  }
}

export type LeadWhatsAppChat = {
  deepLink: string;
  unreadCount: number;
  contactId?: string;
  chatId?: string;
};

export async function getLeadWhatsAppChat(leadId: string): Promise<LeadWhatsAppChat> {
  const response = await requireApiFetch(`/admin/comms/leads/${leadId}/whatsapp/chat`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load WhatsApp chat.', response.status);
  }
  const row = (await response.json()) as {
    deep_link: string;
    unread_count: number;
    contact_id?: string;
    chat_id?: string;
  };
  return {
    deepLink: row.deep_link,
    unreadCount: row.unread_count,
    contactId: row.contact_id,
    chatId: row.chat_id,
  };
}

export type WhatsAppSend = {
  id: string;
  templateId: string;
  templateName: string;
  leadId: string;
  recipientPhone: string;
  status: string;
  skipReason?: string;
  convoniteMessageId?: string;
  createdAt: string;
  sentAt?: string | null;
};

export async function listWhatsAppSends(options?: { limit?: number; offset?: number }): Promise<WhatsAppSend[]> {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset != null) {
    params.set('offset', String(options.offset));
  }
  const query = params.toString();
  const response = await requireApiFetch(`/admin/comms/whatsapp/sends${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new ApiError('Failed to load WhatsApp sends.', response.status);
  }
  const rows = (await response.json()) as Array<{
    id: string;
    template_id: string;
    template_name: string;
    lead_id: string;
    recipient_phone: string;
    status: string;
    skip_reason?: string;
    convonite_message_id?: string;
    created_at: string;
    sent_at?: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    templateName: row.template_name,
    leadId: row.lead_id,
    recipientPhone: row.recipient_phone,
    status: row.status,
    skipReason: row.skip_reason,
    convoniteMessageId: row.convonite_message_id,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  }));
}

export type BulkLeadWhatsAppPreview = {
  template_id: string;
  category: string;
  selected: number;
  will_send: number;
  already_sent: number;
  will_send_if_skip_duplicates: number;
  skipped: {
    no_consent: number;
    no_phone: number;
    invalid_phone: number;
    opted_out: number;
    notify_whatsapp_disabled: number;
    already_sent: number;
    template_not_active: number;
    whatsapp_not_configured: number;
  };
};

export type BulkLeadWhatsAppSendJob = {
  id: string;
  template_id: string;
  template_name?: string;
  template_category?: string;
  sent_by_name?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  selected: number;
  sent: number;
  skipped: number;
  failed: number;
  skip_breakdown: BulkLeadWhatsAppPreview['skipped'];
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type BulkLeadWhatsAppSendRow = {
  id: string;
  lead_id?: string;
  recipient_phone: string;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  skip_reason?: string;
  created_at: string;
  sent_at?: string | null;
};

export type BulkLeadWhatsAppSendList = {
  items: BulkLeadWhatsAppSendRow[];
  total: number;
};

export async function previewBulkLeadWhatsAppSend(
  templateId: string,
  leadIds: string[]
): Promise<BulkLeadWhatsAppPreview> {
  const response = await requireApiFetch('/admin/comms/leads/bulk-whatsapp/preview', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId, lead_ids: leadIds }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to preview bulk WhatsApp send.', response.status);
  }
  return (await response.json()) as BulkLeadWhatsAppPreview;
}

export async function startBulkLeadWhatsAppSend(
  templateId: string,
  leadIds: string[],
  options?: { skipAlreadySent?: boolean }
): Promise<{ job_id: string }> {
  const response = await requireApiFetch('/admin/comms/leads/bulk-whatsapp', {
    method: 'POST',
    body: JSON.stringify({
      template_id: templateId,
      lead_ids: leadIds,
      skip_already_sent: options?.skipAlreadySent ?? false,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to start bulk WhatsApp send.', response.status);
  }
  return (await response.json()) as { job_id: string };
}

export async function getBulkLeadWhatsAppSendJob(jobId: string): Promise<BulkLeadWhatsAppSendJob> {
  const response = await requireApiFetch(`/admin/comms/bulk-whatsapp/${encodeURIComponent(jobId)}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load bulk WhatsApp send job.', response.status);
  }
  return (await response.json()) as BulkLeadWhatsAppSendJob;
}

export async function listBulkLeadWhatsAppSendJobs(limit = 50): Promise<BulkLeadWhatsAppSendJob[]> {
  const response = await requireApiFetch(`/admin/comms/bulk-whatsapp?limit=${encodeURIComponent(String(limit))}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to list bulk WhatsApp send jobs.', response.status);
  }
  return (await response.json()) as BulkLeadWhatsAppSendJob[];
}

export async function listBulkLeadWhatsAppSendJobSends(
  jobId: string,
  options?: { limit?: number; offset?: number }
): Promise<BulkLeadWhatsAppSendList> {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset != null) {
    params.set('offset', String(options.offset));
  }
  const query = params.toString();
  const response = await requireApiFetch(
    `/admin/comms/bulk-whatsapp/${encodeURIComponent(jobId)}/sends${query ? `?${query}` : ''}`
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to load bulk WhatsApp send recipients.', response.status);
  }
  return (await response.json()) as BulkLeadWhatsAppSendList;
}

export const getMarketingContactsSummary = cache(async (): Promise<MarketingContactsSummary> => {
  const response = await requireApiFetch('/admin/comms/contacts/summary');
  if (!response.ok) {
    throw new ApiError('Failed to load marketing contact summary.', response.status);
  }
  const payload = (await response.json()) as {
    used: number;
    active_subscribers: number;
    limit: number;
    percent_used: number;
    source: 'resend' | 'local';
  };
  return {
    used: payload.used,
    activeSubscribers: payload.active_subscribers,
    limit: payload.limit,
    percentUsed: payload.percent_used,
    source: payload.source,
  };
});

export type CommsAnalyticsTotals = {
  sent: number;
  delivered: number;
  bounced: number;
  suppressed: number;
  pending: number;
  stalePending: number;
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
  suppressedCount: number;
  pendingCount: number;
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

export type CommsSend = CommsSendIssue & {
  resendEmailId?: string;
};

export type CommsAutomationStats = {
  automationId: string;
  name: string;
  status: string;
  triggerType: string;
  activeCount: number;
  waitingCount: number;
  completedCount: number;
  failedCount: number;
  totalEnrollments: number;
};

export type CommsAnalytics = {
  totals: CommsAnalyticsTotals;
  templates: CommsTemplatePerformance[];
  automations: CommsAutomationStats[];
  recentSends: CommsSend[];
  recentIssues: CommsSendIssue[];
  webhookUrl: string;
  webhookEnabled: boolean;
};

export type CommsAnalyticsSummary = {
  totals: CommsAnalyticsTotals;
  activeAutomations: number;
  webhookUrl: string;
  webhookEnabled: boolean;
};

export const getCommsAnalyticsSummary = cache(async (): Promise<CommsAnalyticsSummary> => {
  const response = await requireApiFetch('/admin/comms/analytics/summary');
  if (!response.ok) {
    throw new ApiError('Failed to load email analytics.', response.status);
  }
  const payload = (await response.json()) as {
    totals: {
      sent: number;
      delivered: number;
      bounced: number;
      suppressed: number;
      pending: number;
      stale_pending: number;
      opened: number;
      clicked: number;
      failed: number;
      skipped: number;
    };
    active_automations: number;
    webhook_url: string;
    webhook_enabled: boolean;
  };
  return {
    totals: {
      sent: payload.totals.sent,
      delivered: payload.totals.delivered,
      bounced: payload.totals.bounced,
      suppressed: payload.totals.suppressed,
      pending: payload.totals.pending,
      stalePending: payload.totals.stale_pending,
      opened: payload.totals.opened,
      clicked: payload.totals.clicked,
      failed: payload.totals.failed,
      skipped: payload.totals.skipped,
    },
    activeAutomations: payload.active_automations,
    webhookUrl: payload.webhook_url,
    webhookEnabled: payload.webhook_enabled,
  };
});

export const getCommsAnalytics = cache(async (): Promise<CommsAnalytics> => {
  const response = await requireApiFetch('/admin/comms/analytics');
  if (!response.ok) {
    throw new ApiError('Failed to load email analytics.', response.status);
  }
  const payload = (await response.json()) as {
    totals: {
      sent: number;
      delivered: number;
      bounced: number;
      suppressed: number;
      pending: number;
      stale_pending: number;
      opened: number;
      clicked: number;
      failed: number;
      skipped: number;
    };
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
      suppressed_count: number;
      pending_count: number;
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
    automations: Array<{
      automation_id: string;
      name: string;
      status: string;
      trigger_type: string;
      active_count: number;
      waiting_count: number;
      completed_count: number;
      failed_count: number;
      total_enrollments: number;
    }>;
    recent_sends: Array<{
      id: string;
      template_id?: string;
      template_name: string;
      classification: string;
      recipient_email: string;
      status: string;
      skip_reason?: string;
      subject_rendered: string;
      resend_email_id?: string;
      created_at: string;
      sent_at?: string;
    }>;
    webhook_url: string;
    webhook_enabled: boolean;
  };

  const mapSendRow = (row: {
    id: string;
    template_id?: string;
    template_name: string;
    classification: string;
    recipient_email: string;
    status: string;
    skip_reason?: string;
    subject_rendered: string;
    resend_email_id?: string;
    created_at: string;
    sent_at?: string;
  }): CommsSend => ({
    id: row.id,
    templateId: row.template_id,
    templateName: row.template_name,
    classification: row.classification,
    recipientEmail: row.recipient_email,
    status: row.status,
    skipReason: row.skip_reason,
    subjectRendered: row.subject_rendered,
    resendEmailId: row.resend_email_id,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  });

  return {
    totals: {
      sent: payload.totals.sent,
      delivered: payload.totals.delivered,
      bounced: payload.totals.bounced,
      suppressed: payload.totals.suppressed,
      pending: payload.totals.pending,
      stalePending: payload.totals.stale_pending,
      opened: payload.totals.opened,
      clicked: payload.totals.clicked,
      failed: payload.totals.failed,
      skipped: payload.totals.skipped,
    },
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
      suppressedCount: row.suppressed_count,
      pendingCount: row.pending_count,
      openRate: row.open_rate,
      clickRate: row.click_rate,
    })),
    automations: (payload.automations ?? []).map((row) => ({
      automationId: row.automation_id,
      name: row.name,
      status: row.status,
      triggerType: row.trigger_type,
      activeCount: row.active_count,
      waitingCount: row.waiting_count,
      completedCount: row.completed_count,
      failedCount: row.failed_count,
      totalEnrollments: row.total_enrollments,
    })),
    recentSends: (payload.recent_sends ?? []).map(mapSendRow),
    recentIssues: (payload.recent_issues ?? []).map((row) => mapSendRow(row)),
    webhookUrl: payload.webhook_url,
    webhookEnabled: payload.webhook_enabled,
  };
});

export type Automation = import('@/lib/automation-types').Automation;

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
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
  }));
}

function mapAutomation(row: {
  id: string;
  name: string;
  description: string;
  channel?: string;
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
    channel: (row.channel === 'whatsapp' ? 'whatsapp' : 'email') as Automation['channel'],
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

export async function listAutomations(channel?: Automation['channel']): Promise<Automation[]> {
  const query = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  const response = await requireApiFetch(`/admin/comms/automations${query}`);
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
  channel?: Automation['channel'];
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
      channel: input.channel ?? 'email',
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
    channel?: Automation['channel'];
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
      channel: input.channel ?? 'email',
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
  return normalizeValidationResult(await response.json());
}

function normalizeValidationResult(raw: unknown): AutomationValidationResult {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  return {
    valid: Boolean(payload.valid),
    errors: errors.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        node_id: String(row.node_id ?? row.nodeId ?? ''),
        message: String(row.message ?? 'This step needs attention.'),
      };
    }),
  };
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

export async function archiveAutomation(id: string): Promise<Automation> {
  const response = await requireApiFetch(`/admin/comms/automations/${id}/archive`, {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to archive automation.', response.status);
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

export async function getAutomationEnrollmentLog(
  enrollmentId: string
): Promise<import('@/lib/automation-types').AutomationRunLogEntry[]> {
  const response = await requireApiFetch(`/admin/comms/automation-enrollments/${enrollmentId}/log`);
  if (!response.ok) {
    throw new ApiError('Failed to load enrollment run log.', response.status);
  }
  const rows = (await response.json()) as Array<{
    id: number;
    node_id: string;
    node_type: string;
    outcome: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    nodeId: row.node_id,
    nodeType: row.node_type,
    outcome: row.outcome,
    details: row.details ?? {},
    createdAt: row.created_at,
  }));
}

export type ResourceCategory = 'plans' | 'webinars' | 'exercise' | 'guides' | 'recipes' | 'faqs';
export type ResourceKind = 'pdf' | 'youtube';

export type AdminResource = {
  id: string;
  category: ResourceCategory;
  kind: ResourceKind | string;
  title: string;
  tag: string;
  meta: string;
  summary: string;
  thumbnailLabel: string;
  thumbnailUrl: string | null;
  speaker: string | null;
  duration: string | null;
  youtubeVideoId: string | null;
  pdfStoragePath: string | null;
  published: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
};

export type CohortResourceCategory = {
  id: ResourceCategory;
  label: string;
  visible: boolean;
};

export type CreateAdminResourceInput = {
  category: ResourceCategory;
  kind: ResourceKind;
  title: string;
  tag: string;
  summary?: string | null;
  thumbnail_url?: string | null;
  speaker?: string | null;
  duration?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  pdf_storage_path?: string | null;
  published?: boolean;
};

export type PatchAdminResourceInput = Partial<CreateAdminResourceInput>;

export type ResourceUploadPurpose = 'pdf' | 'thumbnail';

export type ResourceUploadUrl = {
  path: string;
  uploadUrl: string;
  token: string;
  purpose: ResourceUploadPurpose;
  publicUrl?: string;
};

export type CohortResourceAssignmentInput = {
  resource_id: string;
  sort_order: number;
  is_featured: boolean;
};

type ApiResourceResponse = {
  id: string;
  category: string;
  kind: string;
  title: string;
  tag: string;
  meta?: string;
  summary?: string;
  thumbnail_label?: string;
  thumbnail_url?: string | null;
  speaker?: string | null;
  duration?: string | null;
  youtube_video_id?: string | null;
  pdf_storage_path?: string | null;
  published?: boolean | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
};

function mapAdminResource(row: ApiResourceResponse): AdminResource {
  return {
    id: row.id,
    category: row.category as ResourceCategory,
    kind: row.kind,
    title: row.title,
    tag: row.tag,
    meta: row.meta ?? '',
    summary: row.summary ?? '',
    thumbnailLabel: row.thumbnail_label ?? '',
    thumbnailUrl: row.thumbnail_url ?? null,
    speaker: row.speaker ?? null,
    duration: row.duration ?? null,
    youtubeVideoId: row.youtube_video_id ?? null,
    pdfStoragePath: row.pdf_storage_path ?? null,
    published: row.published ?? true,
    isFeatured: row.is_featured ?? undefined,
    sortOrder: row.sort_order ?? undefined,
  };
}

export async function listAdminResources(category?: ResourceCategory): Promise<AdminResource[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await requireApiFetch(`/admin/resources${query}`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load resources.');
  }
  const payload = (await response.json()) as { resources: ApiResourceResponse[] };
  return (payload.resources ?? []).map(mapAdminResource);
}

export async function createAdminResource(input: CreateAdminResourceInput): Promise<AdminResource> {
  const response = await requireApiFetch('/admin/resources', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to create resource.');
  }
  return mapAdminResource((await response.json()) as ApiResourceResponse);
}

export async function patchAdminResource(id: string, input: PatchAdminResourceInput): Promise<AdminResource> {
  const response = await requireApiFetch(`/admin/resources/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to update resource.');
  }
  return mapAdminResource((await response.json()) as ApiResourceResponse);
}

export async function deleteAdminResource(id: string): Promise<void> {
  const response = await requireApiFetch(`/admin/resources/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to delete resource.');
  }
}

export async function createResourceUploadUrl(
  filename: string,
  purpose: ResourceUploadPurpose = 'pdf'
): Promise<ResourceUploadUrl> {
  const response = await requireApiFetch('/admin/resources/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename, purpose }),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to create upload URL.');
  }
  const payload = (await response.json()) as {
    path: string;
    upload_url: string;
    token: string;
    purpose?: ResourceUploadPurpose;
    public_url?: string;
  };
  return {
    path: payload.path,
    uploadUrl: payload.upload_url,
    token: payload.token,
    purpose: payload.purpose ?? purpose,
    publicUrl: payload.public_url,
  };
}

export async function getCohortResources(cohortId: string): Promise<{
  cohortId: string;
  featured: AdminResource | null;
  resources: AdminResource[];
}> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/resources`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load cohort resources.');
  }
  const payload = (await response.json()) as {
    cohort_id: string;
    featured: ApiResourceResponse | null;
    resources: ApiResourceResponse[];
  };
  return {
    cohortId: payload.cohort_id,
    featured: payload.featured ? mapAdminResource(payload.featured) : null,
    resources: (payload.resources ?? []).map(mapAdminResource),
  };
}

export async function putCohortResources(
  cohortId: string,
  assignments: CohortResourceAssignmentInput[]
): Promise<{
  cohortId: string;
  featured: AdminResource | null;
  resources: AdminResource[];
}> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/resources`, {
    method: 'PUT',
    body: JSON.stringify(assignments),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to save cohort resources.');
  }
  const payload = (await response.json()) as {
    cohort_id: string;
    featured: ApiResourceResponse | null;
    resources: ApiResourceResponse[];
  };
  return {
    cohortId: payload.cohort_id,
    featured: payload.featured ? mapAdminResource(payload.featured) : null,
    resources: (payload.resources ?? []).map(mapAdminResource),
  };
}

export async function getCohortResourceCategories(cohortId: string): Promise<{
  cohortId: string;
  categories: CohortResourceCategory[];
}> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/resource-categories`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load cohort resource categories.');
  }
  const payload = (await response.json()) as {
    cohort_id: string;
    categories: { id: string; label: string; visible?: boolean }[];
  };
  return {
    cohortId: payload.cohort_id,
    categories: (payload.categories ?? []).map((row) => ({
      id: row.id as ResourceCategory,
      label: row.label,
      visible: row.visible ?? true,
    })),
  };
}

export type CohortResourceCategoryInput = {
  category: ResourceCategory;
  visible: boolean;
};

export async function putCohortResourceCategories(
  cohortId: string,
  categories: CohortResourceCategoryInput[]
): Promise<{
  cohortId: string;
  categories: CohortResourceCategory[];
}> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/resource-categories`, {
    method: 'PUT',
    body: JSON.stringify(categories),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to save cohort resource categories.');
  }
  const payload = (await response.json()) as {
    cohort_id: string;
    categories: { id: string; label: string; visible?: boolean }[];
  };
  return {
    cohortId: payload.cohort_id,
    categories: (payload.categories ?? []).map((row) => ({
      id: row.id as ResourceCategory,
      label: row.label,
      visible: row.visible ?? true,
    })),
  };
}

export type PushSlot = 'am_9' | 'pm_3' | 'pm_8' | 'pm_9' | 'noon' | 'pm_6';
export type PushTemplateStatus = 'draft' | 'active' | 'archived';

export type PushTemplate = {
  id: string;
  name: string;
  status: PushTemplateStatus;
  maxWeek: number;
  totalSlots: number;
  readySlots: number;
  createdAt: string;
  updatedAt: string;
};

export type PushTemplateEntry = {
  weekIndex: number;
  dayIndex: number;
  slot: PushSlot;
  title: string;
  body: string;
};

export type PushTemplateDetail = PushTemplate & {
  entries: PushTemplateEntry[];
};

export type CohortPushAssignment = {
  cohortId: string;
  cohortName: string;
  startsOn: string;
  status: string;
  programId: string;
  programName: string;
  templateId: string | null;
  templateName: string | null;
  templateStatus: PushTemplateStatus | null;
};

function mapPushTemplate(row: {
  id: string;
  name: string;
  status: PushTemplateStatus;
  max_week: number;
  total_slots?: number;
  ready_slots?: number;
  created_at: string;
  updated_at: string;
}): PushTemplate {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    maxWeek: row.max_week,
    totalSlots: row.total_slots ?? 0,
    readySlots: row.ready_slots ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPushTemplateDetail(row: {
  id: string;
  name: string;
  status: PushTemplateStatus;
  max_week: number;
  total_slots?: number;
  ready_slots?: number;
  created_at: string;
  updated_at: string;
  entries: { week_index: number; day_index: number; slot: PushSlot; title: string; body: string }[];
}): PushTemplateDetail {
  return {
    ...mapPushTemplate(row),
    entries: (row.entries ?? []).map((e) => ({
      weekIndex: e.week_index,
      dayIndex: e.day_index,
      slot: e.slot,
      title: e.title,
      body: e.body,
    })),
  };
}

export async function listPushTemplates(): Promise<PushTemplate[]> {
  const response = await requireApiFetch('/admin/push-templates');
  if (!response.ok) {
    await parseApiError(response, 'Failed to list push templates.');
  }
  const rows = (await response.json()) as Parameters<typeof mapPushTemplate>[0][];
  return rows.map(mapPushTemplate);
}

export async function getPushTemplate(id: string): Promise<PushTemplateDetail> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}`);
  if (!response.ok) {
    await parseApiError(response, 'Failed to load push template.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function createPushTemplate(name: string): Promise<PushTemplateDetail> {
  const response = await requireApiFetch('/admin/push-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to create push template.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function patchPushTemplate(
  id: string,
  input: { name?: string; status?: PushTemplateStatus }
): Promise<PushTemplateDetail> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to update push template.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function deletePushTemplate(id: string): Promise<void> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to delete push template.');
  }
}

export async function putPushTemplateEntries(id: string, entries: PushTemplateEntry[]): Promise<PushTemplateDetail> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}/entries`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entries: entries.map((e) => ({
        week_index: e.weekIndex,
        day_index: e.dayIndex,
        slot: e.slot,
        title: e.title,
        body: e.body,
      })),
    }),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to save push template entries.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function addPushTemplateWeek(id: string): Promise<PushTemplateDetail> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}/weeks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to add week.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function removePushTemplateLastWeek(id: string): Promise<PushTemplateDetail> {
  const response = await requireApiFetch(`/admin/push-templates/${encodeURIComponent(id)}/remove-last-week`, {
    method: 'POST',
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to remove week.');
  }
  return mapPushTemplateDetail(await response.json());
}

export async function listCohortPushAssignments(): Promise<CohortPushAssignment[]> {
  const response = await requireApiFetch('/admin/push-template-assignments');
  if (!response.ok) {
    await parseApiError(response, 'Failed to list cohort push assignments.');
  }
  const rows = (await response.json()) as {
    cohort_id: string;
    cohort_name: string;
    starts_on: string;
    status: string;
    program_id: string;
    program_name: string;
    template_id: string | null;
    template_name: string | null;
    template_status: PushTemplateStatus | null;
  }[];
  return rows.map((row) => ({
    cohortId: row.cohort_id,
    cohortName: row.cohort_name,
    startsOn: row.starts_on,
    status: row.status,
    programId: row.program_id,
    programName: row.program_name,
    templateId: row.template_id,
    templateName: row.template_name,
    templateStatus: row.template_status,
  }));
}

export async function patchCohortPushTemplate(cohortId: string, templateId: string | null): Promise<void> {
  const response = await requireApiFetch(`/admin/cohorts/${encodeURIComponent(cohortId)}/push-template`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: templateId }),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to update cohort push template.');
  }
}

export type CheckInServingsSnapshot = {
  protein: number;
  fiber: number;
  starch: number;
  dairy: number;
  fun: number;
};

export type CheckInWeekOption = {
  offset: number;
  weekStartDate: string;
  weekNumber: number;
  label: string;
};

export type CheckInDayOption = {
  date: string;
  status: string;
  selectable: boolean;
};

export type CheckInSchedule = {
  timezoneId?: string;
  currentProgramDay: string;
  programStartMonday?: string;
  startsOn?: string;
  maxOffset: number;
  weekOffset: number;
  awaitingStart: boolean;
  pointAComplete: boolean;
  weeks: CheckInWeekOption[];
  days: CheckInDayOption[];
  recommendedServings?: CheckInServingsSnapshot;
};

export type CheckInDay = {
  exists: boolean;
  localDate: string;
  steps?: number;
  sleepHours?: number;
  exercised?: boolean;
  exerciseType?: string;
  exerciseIntensity?: string;
  nutritionAnswers?: Record<string, string>;
  nutritionScore?: number;
  stars?: number;
  servingsSnapshot: CheckInServingsSnapshot;
  updatedAt?: string;
  updatedBy?: string;
};

export type PutCheckInInput = {
  localDate: string;
  steps: number;
  sleepHours: number;
  exercised: boolean;
  exerciseType?: string;
  exerciseIntensity?: string;
  nutritionAnswers: Record<string, string>;
};

export type PutCheckInResult = {
  localDate: string;
  steps: number;
  sleepHours: number;
  exercised: boolean;
  exerciseType?: string;
  exerciseIntensity?: string;
  nutritionAnswers: Record<string, string>;
  nutritionScore: number;
  stars: number;
  goalsRebuilt: boolean;
};

function mapCheckInServings(row: {
  protein: number;
  fiber: number;
  starch: number;
  dairy: number;
  fun: number;
}): CheckInServingsSnapshot {
  return {
    protein: row.protein,
    fiber: row.fiber,
    starch: row.starch,
    dairy: row.dairy,
    fun: row.fun,
  };
}

export async function getLeadCheckInSchedule(leadId: string, weekOffset = 0): Promise<CheckInSchedule> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/check-ins/schedule?week_offset=${weekOffset}`
  );
  if (!response.ok) {
    await parseApiError(response, 'Failed to load check-in schedule.');
  }
  const row = (await response.json()) as {
    timezone_id?: string;
    current_program_day: string;
    program_start_monday?: string;
    starts_on?: string;
    max_offset: number;
    week_offset: number;
    awaiting_start: boolean;
    point_a_complete: boolean;
    weeks: { offset: number; week_start_date: string; week_number: number; label: string }[];
    days: { date: string; status: string; selectable: boolean }[];
    recommended_servings?: { protein: number; fiber: number; starch: number; dairy: number; fun: number };
  };
  return {
    timezoneId: row.timezone_id,
    currentProgramDay: row.current_program_day,
    programStartMonday: row.program_start_monday,
    startsOn: row.starts_on,
    maxOffset: row.max_offset,
    weekOffset: row.week_offset,
    awaitingStart: row.awaiting_start,
    pointAComplete: row.point_a_complete,
    weeks: row.weeks.map((w) => ({
      offset: w.offset,
      weekStartDate: w.week_start_date,
      weekNumber: w.week_number,
      label: w.label,
    })),
    days: row.days.map((d) => ({
      date: d.date,
      status: d.status,
      selectable: d.selectable,
    })),
    recommendedServings: row.recommended_servings ? mapCheckInServings(row.recommended_servings) : undefined,
  };
}

export async function getLeadCheckIn(leadId: string, localDate: string): Promise<CheckInDay> {
  const response = await requireApiFetch(
    `/admin/leads/${encodeURIComponent(leadId)}/check-ins?local_date=${encodeURIComponent(localDate)}`
  );
  if (!response.ok) {
    await parseApiError(response, 'Failed to load check-in.');
  }
  const row = (await response.json()) as {
    exists: boolean;
    local_date: string;
    steps?: number;
    sleep_hours?: number;
    exercised?: boolean;
    exercise_type?: string;
    exercise_intensity?: string;
    nutrition_answers?: Record<string, string>;
    nutrition_score?: number;
    stars?: number;
    servings_snapshot: { protein: number; fiber: number; starch: number; dairy: number; fun: number };
    updated_at?: string;
    updated_by?: string;
  };
  return {
    exists: row.exists,
    localDate: row.local_date,
    steps: row.steps,
    sleepHours: row.sleep_hours,
    exercised: row.exercised,
    exerciseType: row.exercise_type,
    exerciseIntensity: row.exercise_intensity,
    nutritionAnswers: row.nutrition_answers,
    nutritionScore: row.nutrition_score,
    stars: row.stars,
    servingsSnapshot: mapCheckInServings(row.servings_snapshot),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function putLeadCheckIn(leadId: string, input: PutCheckInInput): Promise<PutCheckInResult> {
  const response = await requireApiFetch(`/admin/leads/${encodeURIComponent(leadId)}/check-ins`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      local_date: input.localDate,
      steps: input.steps,
      sleep_hours: input.sleepHours,
      exercised: input.exercised,
      exercise_type: input.exerciseType,
      exercise_intensity: input.exerciseIntensity,
      nutrition_answers: input.nutritionAnswers,
    }),
  });
  if (!response.ok) {
    await parseApiError(response, 'Failed to save check-in.');
  }
  const row = (await response.json()) as {
    local_date: string;
    steps: number;
    sleep_hours: number;
    exercised: boolean;
    exercise_type?: string;
    exercise_intensity?: string;
    nutrition_answers: Record<string, string>;
    nutrition_score: number;
    stars: number;
    goals_rebuilt: boolean;
  };
  return {
    localDate: row.local_date,
    steps: row.steps,
    sleepHours: row.sleep_hours,
    exercised: row.exercised,
    exerciseType: row.exercise_type,
    exerciseIntensity: row.exercise_intensity,
    nutritionAnswers: row.nutrition_answers,
    nutritionScore: row.nutrition_score,
    stars: row.stars,
    goalsRebuilt: row.goals_rebuilt,
  };
}
