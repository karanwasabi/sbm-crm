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

export function formatLakhsFromPaise(paise: number): string {
  if (paise <= 0) {
    return '₹0';
  }
  const lakhs = paise / 10_000_000;
  if (lakhs >= 1) {
    return `₹${lakhs.toFixed(1)}L`;
  }
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
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
