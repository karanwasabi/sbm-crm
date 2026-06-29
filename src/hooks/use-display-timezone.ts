'use client';

import { useCrmProfile } from '@/components/layout/crm/crm-profile-context';
import { resolveDisplayTimezone } from '@/lib/datetime-display';

export function useDisplayTimezone(): string {
  const { profile } = useCrmProfile();
  return resolveDisplayTimezone(profile?.timezone_id);
}
