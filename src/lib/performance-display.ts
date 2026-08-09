import type { PerformanceWindow } from '@/lib/performance-drilldown-url';

export type PerformanceWindowPreset = 'today' | 7 | 30 | 90 | 365 | 'all';

export const PERFORMANCE_WINDOW_OPTIONS: Array<{ label: string; days: PerformanceWindowPreset }> = [
  { label: 'Today', days: 'today' },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 'all' },
];

export function performanceWindowQueryParam(days: PerformanceWindowPreset): string {
  if (days === 'all') return 'all';
  if (days === 'today') return 'today';
  return String(days);
}

export function formatPerformanceDateRange(window: PerformanceWindow | null, preset: PerformanceWindowPreset): string {
  if (preset === 'today') {
    return 'Today';
  }
  if (preset === 'all') {
    return 'All time';
  }
  if (preset === 7) {
    return 'Last 7 days';
  }
  if (window?.since && window?.until) {
    return `${formatShortDate(window.since)} – ${formatShortDate(window.until)}`;
  }
  if (preset === 365) {
    return 'Last year';
  }
  return `Last ${preset} days`;
}

export function formatMarketingActivityDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function formatShortDate(iso: string): string {
  return formatMarketingActivityDate(iso) ?? iso.slice(0, 10);
}
