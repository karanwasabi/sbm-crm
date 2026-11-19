'use client';

import { mapRevenueAnalytics, type RevenueAnalytics } from '@/lib/revenue-analytics';
import { createClient } from '@/utils/supabase/client';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

export async function fetchRevenueAnalyticsClient(query: string): Promise<RevenueAnalytics> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Not signed in');
  }
  const suffix = query ? `?${query.replace(/^\?/, '')}` : '';
  const response = await fetch(`${getBackendUrl()}/admin/analytics/revenue${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load revenue analytics (${response.status})`);
  }
  return mapRevenueAnalytics((await response.json()) as Record<string, unknown>);
}
