import type { PerformanceWindow } from '@/lib/performance-drilldown-url';

export type PerformanceWindowPreset = 'today' | 'yesterday' | 7 | 30 | 90 | 365 | 'all';

export const PERFORMANCE_WINDOW_OPTIONS: Array<{ label: string; days: PerformanceWindowPreset }> = [
  { label: 'Today', days: 'today' },
  { label: 'Yesterday', days: 'yesterday' },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 'all' },
];

export function performanceWindowQueryParam(days: PerformanceWindowPreset): string {
  if (days === 'all') return 'all';
  if (days === 'today') return 'today';
  if (days === 'yesterday') return 'yesterday';
  return String(days);
}

export function formatPerformanceDateRange(window: PerformanceWindow | null, preset: PerformanceWindowPreset): string {
  if (preset === 'today') {
    return 'Today';
  }
  if (preset === 'yesterday') {
    if (window?.since) {
      return formatMarketingActivityDate(window.since) ?? 'Yesterday';
    }
    return 'Yesterday';
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

export function dashboardLeadKpiLabel(preset: PerformanceWindowPreset): string {
  switch (preset) {
    case 'today':
      return 'New leads today';
    case 'yesterday':
      return 'New leads yesterday';
    case 'all':
      return 'Total leads';
    default:
      return 'New leads';
  }
}

export function dashboardRevenueKpiLabel(preset: PerformanceWindowPreset): string {
  switch (preset) {
    case 'today':
      return 'Revenue today';
    case 'yesterday':
      return 'Revenue yesterday';
    case 'all':
      return 'Revenue all time';
    default:
      return 'Revenue';
  }
}

export function dashboardRevenueChartTitle(preset: PerformanceWindowPreset, windowDays?: number): string {
  if (preset === 'today' || preset === 'yesterday') {
    return 'Daily revenue';
  }
  if (preset === 'all') {
    return 'Weekly revenue';
  }
  if (windowDays != null && windowDays > 0 && windowDays <= 14) {
    return 'Daily revenue';
  }
  return 'Weekly revenue';
}
