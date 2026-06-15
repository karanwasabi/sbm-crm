import type { StaffAccessRole } from '@/lib/access';
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
