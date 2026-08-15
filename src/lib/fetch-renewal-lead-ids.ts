'use client';

import { createClient } from '@/utils/supabase/client';
import { buildRenewalsSearchParams, type RenewalFilters } from '@/lib/renewal-query';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

export async function fetchRenewalLeadIds(filters: RenewalFilters): Promise<{ ids: string[]; total: number }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const query = buildRenewalsSearchParams(filters).toString();
  const response = await fetch(`${getBackendUrl()}/admin/renewals/lead-ids${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load matching members.');
  }
  const payload = (await response.json()) as { ids?: string[]; total?: number };
  return { ids: payload.ids ?? [], total: payload.total ?? 0 };
}
