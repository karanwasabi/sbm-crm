import type { StaffAccessRole } from '@/lib/access';
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

export async function fetchCountries(): Promise<Country[]> {
  const response = await requireApiFetch('/reference/countries');
  if (!response.ok) {
    throw new ApiError('Failed to load countries.', response.status);
  }
  return response.json() as Promise<Country[]>;
}

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

export async function getLeadSummary(): Promise<import('@/types/crm').LeadSummary> {
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
}

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
