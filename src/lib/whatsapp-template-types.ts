export type WhatsAppTemplateStatus = 'draft' | 'submitted' | 'active' | 'rejected' | 'paused' | 'deleted';

export type WhatsAppTemplateCategory = 'marketing' | 'utility' | 'authentication';

export type WhatsAppTemplatePurpose = 'individual' | 'broadcast';

export const WHATSAPP_TEMPLATE_CATEGORY_OPTIONS: { value: WhatsAppTemplateCategory; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'utility', label: 'Utility' },
  { value: 'authentication', label: 'Authentication' },
];

export const WHATSAPP_TEMPLATE_PURPOSE_OPTIONS: { value: WhatsAppTemplatePurpose; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'broadcast', label: 'Broadcast' },
];

export const WHATSAPP_TEMPLATE_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English (en)' },
  { value: 'hi', label: 'Hindi (hi)' },
];

export function whatsAppTemplateStatusLabel(status: WhatsAppTemplateStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted';
    case 'active':
      return 'Active';
    case 'rejected':
      return 'Rejected';
    case 'paused':
      return 'Paused';
    case 'deleted':
      return 'Deleted';
    default:
      return status;
  }
}

export function whatsAppTemplateStatusTone(
  status: WhatsAppTemplateStatus
): 'success' | 'warn' | 'neutral' | 'brand' | 'danger' {
  switch (status) {
    case 'active':
      return 'success';
    case 'submitted':
      return 'brand';
    case 'rejected':
    case 'deleted':
      return 'danger';
    case 'paused':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function whatsAppTemplateCategoryLabel(category: WhatsAppTemplateCategory): string {
  return WHATSAPP_TEMPLATE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}
