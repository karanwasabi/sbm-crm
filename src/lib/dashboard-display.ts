export function formatPeriodTrend(current: number, previous: number): string {
  if (previous <= 0) {
    return '—';
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
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
  return `${Math.round(rate * 1000) / 10}%`;
}

export function formatLeadCount(count: number): string {
  return count.toLocaleString('en-IN');
}
