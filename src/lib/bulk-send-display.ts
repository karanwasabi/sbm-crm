import type { BulkLeadEmailPreview, BulkLeadWhatsAppPreview } from '@/utils/api';

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

export function formatBulkWhatsAppSkipSummary(skipped: BulkLeadWhatsAppPreview['skipped']): string[] {
  const lines: string[] = [];
  if (skipped.no_consent > 0) {
    lines.push(`${skipped.no_consent} no consent`);
  }
  if (skipped.no_phone > 0) {
    lines.push(`${skipped.no_phone} no phone`);
  }
  if (skipped.invalid_phone > 0) {
    lines.push(`${skipped.invalid_phone} invalid phone`);
  }
  if (skipped.opted_out > 0) {
    lines.push(`${skipped.opted_out} opted out`);
  }
  if (skipped.notify_whatsapp_disabled > 0) {
    lines.push(`${skipped.notify_whatsapp_disabled} WhatsApp notifications off`);
  }
  if (skipped.already_sent > 0) {
    lines.push(`${skipped.already_sent} already sent`);
  }
  if (skipped.template_not_active > 0) {
    lines.push(`${skipped.template_not_active} template not active`);
  }
  if (skipped.whatsapp_not_configured > 0) {
    lines.push(`${skipped.whatsapp_not_configured} WhatsApp not configured`);
  }
  if ((skipped.missing_param ?? 0) > 0) {
    lines.push(`${skipped.missing_param} missing param`);
  }
  return lines;
}

export function bulkWhatsAppSkipTotal(skipped: BulkLeadWhatsAppPreview['skipped']): number {
  return (
    skipped.no_consent +
    skipped.no_phone +
    skipped.invalid_phone +
    skipped.opted_out +
    skipped.notify_whatsapp_disabled +
    skipped.already_sent +
    skipped.template_not_active +
    skipped.whatsapp_not_configured +
    (skipped.missing_param ?? 0)
  );
}
