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

export function performanceWindowLabel(preset: PerformanceWindowPreset): string {
  switch (preset) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'all':
      return 'All time';
    case 7:
      return 'Last 7 days';
    case 365:
      return 'Last year';
    default:
      return `Last ${preset} days`;
  }
}

export function formatPerformanceWindowDates(
  window: PerformanceWindow | null | undefined,
  preset?: PerformanceWindowPreset
): string | null {
  if (!window?.since) {
    return null;
  }

  const since = formatShortDate(window.since);
  if (!window.until) {
    return preset === 'all' ? `Since ${since}` : since;
  }

  const until = formatShortDate(window.until);
  if (preset === 'all') {
    return `Since ${since}`;
  }
  if (since === until) {
    return since;
  }
  return `${since} – ${until}`;
}

export function coercePerformanceWindow(
  ...windows: Array<PerformanceWindow | null | undefined>
): PerformanceWindow | null {
  for (const window of windows) {
    if (window?.since && window?.until) {
      return window;
    }
  }
  for (const window of windows) {
    if (window?.since) {
      return window;
    }
  }
  return windows.find(Boolean) ?? null;
}

function startOfTodayIST(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
}

/** Mirrors backend IST performance windows when the API omits since/until. */
export function inferPerformanceWindow(preset: PerformanceWindowPreset): PerformanceWindow | null {
  const timezone = 'Asia/Kolkata';
  const now = new Date();

  if (preset === 'all') {
    return null;
  }

  if (preset === 'today') {
    const since = startOfTodayIST(now);
    return { timezone, since: since.toISOString(), until: now.toISOString() };
  }

  if (preset === 'yesterday') {
    const startToday = startOfTodayIST(now);
    const since = new Date(startToday);
    since.setDate(since.getDate() - 1);
    return { timezone, since: since.toISOString(), until: startToday.toISOString() };
  }

  const startToday = startOfTodayIST(now);
  const since = new Date(startToday);
  since.setDate(since.getDate() - preset);
  return { timezone, since: since.toISOString(), until: now.toISOString() };
}

export function resolvePerformanceWindow(
  preset: PerformanceWindowPreset,
  ...windows: Array<PerformanceWindow | null | undefined>
): PerformanceWindow | null {
  const fromApi = coercePerformanceWindow(...windows);
  if (fromApi?.since) {
    return fromApi;
  }
  return inferPerformanceWindow(preset);
}

export function formatPerformanceDateRange(window: PerformanceWindow | null, preset: PerformanceWindowPreset): string {
  const label = performanceWindowLabel(preset);
  const dates = formatPerformanceWindowDates(window, preset);
  return dates ? `${label} · ${dates}` : label;
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
