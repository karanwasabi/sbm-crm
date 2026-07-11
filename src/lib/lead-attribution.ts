import { leadSourceLabel } from '@/lib/lead-sources';
import type { LeadAttribution } from '@/types/crm';

export function attributionSourceLabel(attribution: LeadAttribution): string {
  const fromSlug = leadSourceLabel(attribution.source);
  if (fromSlug && fromSlug !== attribution.source) {
    return fromSlug;
  }
  if (attribution.sourceLabel.trim()) {
    return attribution.sourceLabel.trim();
  }
  return fromSlug || 'Unknown';
}

export function attributionFormLabel(attribution: LeadAttribution): string | null {
  if (attribution.intakeFormTitle?.trim()) {
    return attribution.intakeFormTitle.trim();
  }
  if (attribution.intakeFormName?.trim()) {
    return attribution.intakeFormName.trim();
  }
  if (attribution.metaFormName?.trim()) {
    return attribution.metaFormName.trim();
  }
  if (attribution.formId?.trim()) {
    return attribution.formId.trim();
  }
  return null;
}
