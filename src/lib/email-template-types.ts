export type EmailTemplateLayout = 'simple' | 'hero' | 'cta' | 'two_column' | 'receipt' | 'digest';

export type EmailTemplateClassification = 'transactional' | 'marketing';

export type EmailTemplateStatus = 'draft' | 'active' | 'archived';

export type EmailBlock =
  | { type: 'heading'; text: string; column?: 'main' | 'sidebar' }
  | { type: 'paragraph'; text: string; column?: 'main' | 'sidebar' }
  | { type: 'button'; text: string; url: string; column?: 'main' | 'sidebar' }
  | { type: 'divider'; column?: 'main' | 'sidebar' }
  | { type: 'image'; src: string; alt: string; column?: 'main' | 'sidebar' };

export type EmailTemplateContent = {
  layout: EmailTemplateLayout;
  classification: EmailTemplateClassification;
  subject: string;
  blocks: EmailBlock[];
};

export const EMAIL_LAYOUT_OPTIONS: Array<{ id: EmailTemplateLayout; label: string; description: string }> = [
  { id: 'simple', label: 'Letter', description: 'Personal note — heading, body, one action' },
  { id: 'hero', label: 'Hero', description: 'Bold headline band, then story + CTA' },
  { id: 'cta', label: 'CTA focus', description: 'Centered message with a prominent button' },
  { id: 'two_column', label: 'Main + sidebar', description: 'Story on the left, tips or extras on the right' },
  { id: 'receipt', label: 'Confirmation', description: 'Structured details card for receipts & enrolment' },
  { id: 'digest', label: 'Digest', description: 'Multiple sections with dividers between topics' },
];

export const EMAIL_VARIABLES = [
  { token: '{{lead.first_name}}', label: 'First name' },
  { token: '{{lead.last_name}}', label: 'Last name' },
  { token: '{{lead.email}}', label: 'Email' },
  { token: '{{lead.city}}', label: 'City' },
  { token: '{{lead.program_interest}}', label: 'Program interest' },
  { token: '{{member.program_name}}', label: 'Program name' },
  { token: '{{member.cohort_name}}', label: 'Cohort name' },
  { token: '{{links.portal}}', label: 'Portal link' },
  { token: '{{links.unsubscribe}}', label: 'Unsubscribe link' },
] as const;

export const MARKETING_CONTACT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'No email',
  no_consent: 'No consent',
  eligible: 'Eligible',
  active: 'Marketing contact',
  unsubscribed: 'Unsubscribed',
};
