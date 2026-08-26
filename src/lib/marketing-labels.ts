export function humanizeMarketingLabel(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }
  const trimmed = value.trim();
  switch (trimmed.toUpperCase()) {
    case 'SALES':
      return 'Sales';
    case 'WEBSITE_TRAFFIC':
    case 'WEB_TRAFFIC':
    case 'WEB-TRAFFIC':
      return 'Website traffic';
    case 'LEAD_GEN':
    case 'LEADGEN':
      return 'Lead gen';
    case 'INSTANT_FORM':
    case 'INSTANTFORM':
      return 'Instant form';
    default:
      break;
  }
  return trimmed.replace(/_/g, ' ').replace(/\s+/g, ' ');
}
