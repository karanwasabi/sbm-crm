import type { AccessClaims, AppRole } from '@/lib/access';
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

export async function getMyAccess(): Promise<AccessClaims> {
  const response = await requireApiFetch('/me/access');
  if (!response.ok) {
    throw new ApiError(`Failed to load access (${response.status})`, response.status);
  }
  return response.json() as Promise<AccessClaims>;
}

export type StaffRoleRow = {
  user_id: string;
  email: string;
  role: AppRole;
  granted_at: string;
};

export async function listStaffRoles(): Promise<StaffRoleRow[]> {
  const response = await requireApiFetch('/admin/staff-roles');
  if (!response.ok) {
    throw new ApiError('Failed to load team roles.', response.status);
  }
  return response.json() as Promise<StaffRoleRow[]>;
}

export async function grantRole(email: string, role: AppRole): Promise<void> {
  const response = await requireApiFetch('/admin/roles', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to grant role.', response.status);
  }
}

export async function revokeRole(userId: string, role: AppRole): Promise<void> {
  const response = await requireApiFetch(`/admin/users/${encodeURIComponent(userId)}/roles/${role}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Failed to revoke role.', response.status);
  }
}
