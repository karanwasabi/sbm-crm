import type { LeadAttribution } from '@/types/crm';

export function attributionSourceLabel(attribution: LeadAttribution): string {
  if (attribution.sourceLabel.trim()) {
    return attribution.sourceLabel;
  }
  switch (attribution.source) {
    case 'lead_intake_form':
      return 'Lead intake form';
    case 'meta':
      return 'Meta Lead Ads';
    default:
      return attribution.source || 'Unknown';
  }
}

export function attributionFormLabel(attribution: LeadAttribution): string | null {
  if (attribution.intakeFormTitle?.trim()) {
    return attribution.intakeFormTitle.trim();
  }
  if (attribution.intakeFormName?.trim()) {
    return attribution.intakeFormName.trim();
  }
  if (attribution.formId?.trim()) {
    return attribution.formId.trim();
  }
  return null;
}
