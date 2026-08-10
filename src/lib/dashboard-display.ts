export function formatPeriodTrend(current: number, previous: number): string | undefined {
  if (previous <= 0) {
    return undefined;
  }
  const pct = ((current - previous) / previous) * 100;
  if (!Number.isFinite(pct)) {
    return undefined;
  }
  const rounded = Math.round(pct);
  if (rounded === 0) {
    return undefined;
  }
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

export function formatThousandsFromPaise(paise: number): string {
  if (paise <= 0) {
    return '₹0';
  }
  const thousands = paise / 100_000;
  if (thousands >= 100) {
    return `₹${(thousands / 100).toFixed(1)}L`;
  }
  if (thousands >= 10) {
    return `₹${Math.round(thousands)}k`;
  }
  if (thousands >= 1) {
    return `₹${thousands.toFixed(1)}k`;
  }
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export function lakhsToThousands(lakhs: number): number {
  return Math.round(lakhs * 100 * 10) / 10;
}

export function formatChartThousands(value: number): string {
  if (value <= 0) {
    return '0';
  }
  if (value >= 10) {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

export function chartNiceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const padded = value * 1.08;
  const exp = Math.floor(Math.log10(padded));
  const base = 10 ** exp;
  const frac = padded / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}

export function chartYAxisTicks(maxValue: number, segments = 4): number[] {
  const yMax = chartNiceMax(maxValue);
  return Array.from({ length: segments + 1 }, (_, index) => Math.round(((yMax * index) / segments) * 10) / 10);
}

export function formatConversionRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) {
    return '0%';
  }
  return `${Math.round(rate * 1000) / 10}%`;
}

export function formatLeadCount(count: number): string {
  return count.toLocaleString('en-IN');
}

export function formatFunnelDrop(current: number, previous: number): string | null {
  if (previous <= 0 || current > previous) {
    return null;
  }
  const drop = Math.round((1 - current / previous) * 100);
  if (!Number.isFinite(drop) || drop <= 0) {
    return null;
  }
  return `↓ ${drop}%`;
}

export function formatFunnelShare(count: number, max: number): string {
  if (max <= 0 || count <= 0) {
    return '0%';
  }
  const pct = Math.round((count / max) * 100);
  return `${pct}%`;
}

export const REVENUE_WEEK_SLOTS = 8;

function weekStartUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (weekday - 1));
  return d;
}

export function formatWeekRangeLabel(start: Date): string {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const month = (d: Date) => d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${month(start)} ${start.getUTCDate()}–${end.getUTCDate()}`;
  }
  return `${month(start)} ${start.getUTCDate()} – ${month(end)} ${end.getUTCDate()}`;
}

export function normalizeRevenueWeeks(
  rows: Array<{ weekLabel: string; revenueLakhs: number }>,
  slotCount = REVENUE_WEEK_SLOTS
): Array<{ week: string; revenue: number }> {
  if (rows.length > 0) {
    const mapped = rows.map((row) => ({
      week: row.weekLabel,
      revenue: lakhsToThousands(row.revenueLakhs),
    }));
    if (mapped.length <= slotCount) {
      return mapped;
    }
    return mapped.slice(-slotCount);
  }

  const trailing = rows.slice(-slotCount);
  const paddedCount = slotCount - trailing.length;
  const currentWeek = weekStartUTC(new Date());

  return Array.from({ length: slotCount }, (_, index) => {
    const start = new Date(currentWeek);
    start.setUTCDate(start.getUTCDate() - 7 * (slotCount - 1 - index));
    const revenue = index >= paddedCount ? lakhsToThousands(trailing[index - paddedCount].revenueLakhs) : 0;
    return {
      week: formatWeekRangeLabel(start),
      revenue,
    };
  });
}
