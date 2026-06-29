'use client';

import { formatLeadTimestamp } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';

export function LeadTimestamp({ iso }: { iso: string }) {
  const timezone = useDisplayTimezone();
  return <>{formatLeadTimestamp(iso, timezone)}</>;
}
