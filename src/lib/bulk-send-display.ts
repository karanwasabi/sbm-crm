import type { BulkLeadEmailPreview } from '@/utils/api';

export function formatBulkSkipSummary(skipped: BulkLeadEmailPreview['skipped']): string[] {
  const lines: string[] = [];
  if (skipped.no_consent > 0) {
    lines.push(`${skipped.no_consent} no consent`);
  }
  if (skipped.unsubscribed > 0) {
    lines.push(`${skipped.unsubscribed} unsubscribed`);
  }
  if (skipped.no_email > 0) {
    lines.push(`${skipped.no_email} no email`);
  }
  if (skipped.marketing_contact_cap > 0) {
    lines.push(`${skipped.marketing_contact_cap} marketing contact cap`);
  }
  if (skipped.already_sent > 0) {
    lines.push(`${skipped.already_sent} already sent`);
  }
  return lines;
}

export function bulkSkipTotal(skipped: BulkLeadEmailPreview['skipped']): number {
  return (
    skipped.no_consent + skipped.unsubscribed + skipped.no_email + skipped.marketing_contact_cap + skipped.already_sent
  );
}
