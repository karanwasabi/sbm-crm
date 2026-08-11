/** CRM labels for renewal_plan_key / duration filters. */

export const RENEWAL_DURATION_FILTER_OPTIONS: Array<{ value: string; label: string; count: number }> = [
  { value: '1', label: '1 month', count: 0 },
  { value: '3', label: '3 months', count: 0 },
  { value: '6', label: '6 months', count: 0 },
  { value: '12', label: '12 months', count: 0 },
];

export function renewalDurationFilterLabel(value: string): string {
  return RENEWAL_DURATION_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? `${value} months`;
}
