export function humanizeMarketingLabel(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }
  return value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
}
