'use client';

import { formatLeadTimestamp, formatLeadTimestampLines } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';

export function LeadTimestamp({ iso }: { iso: string }) {
  const timezone = useDisplayTimezone();
  return <>{formatLeadTimestamp(iso, timezone)}</>;
}

/** Stacked date/time for dense tables — fits narrow columns without horizontal overlap. */
export function LeadTableTimestamp({ iso }: { iso: string }) {
  const timezone = useDisplayTimezone();
  const lines = formatLeadTimestampLines(iso, timezone);
  if (!lines) return <>{iso || '—'}</>;

  return (
    <span className="block leading-snug">
      <span className="block text-[11px] whitespace-nowrap tabular-nums">{lines.date}</span>
      <span className="block text-[10px] whitespace-nowrap text-slate-500 tabular-nums">{lines.time}</span>
    </span>
  );
}
