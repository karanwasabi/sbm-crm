/** CRM labels for renewal_plan_key / duration filters. */

export const RENEWAL_DURATION_FILTER_OPTIONS: Array<{ value: string; label: string; count: number }> = [
  { value: '1', label: '1 month', count: 0 },
  { value: '3', label: '3 months', count: 0 },
  { value: '6', label: '6 months', count: 0 },
  { value: '12', label: '12 months', count: 0 },
  { value: 'trial_extend', label: 'Trial +2 only', count: 0 },
];

export function renewalDurationFilterLabel(value: string): string {
  return RENEWAL_DURATION_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? `${value} months`;
}

/** Merge API facet counts onto the fixed duration option list (stable order/labels). */
export function mergeRenewalDurationFilterOptions(
  apiOptions?: Array<{ value: string; label?: string; count: number }> | null
): Array<{ value: string; label: string; count: number }> {
  const counts = new Map((apiOptions ?? []).map((option) => [option.value, option.count]));
  return RENEWAL_DURATION_FILTER_OPTIONS.map((option) => ({
    ...option,
    count: counts.get(option.value) ?? 0,
  }));
}
