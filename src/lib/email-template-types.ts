export type EmailTemplateLayout = 'simple' | 'hero' | 'cta' | 'two_column' | 'receipt' | 'digest';

export type EmailTemplateClassification = 'transactional' | 'marketing';

export type EmailTemplateStatus = 'draft' | 'active' | 'archived';

export type EmailBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'button'; text: string; url: string }
  | { type: 'divider' }
  | { type: 'image'; src: string; alt: string };

export type EmailTemplateContent = {
  layout: EmailTemplateLayout;
  classification: EmailTemplateClassification;
  subject: string;
  blocks: EmailBlock[];
};

export const EMAIL_LAYOUT_OPTIONS: Array<{ id: EmailTemplateLayout; label: string; description: string }> = [
  { id: 'simple', label: 'Simple', description: 'Plain letter-style update' },
  { id: 'hero', label: 'Hero', description: 'Headline with intro and CTA' },
  { id: 'cta', label: 'CTA focus', description: 'Single action button' },
  { id: 'two_column', label: 'Two column', description: 'Main content with sidebar tips' },
  { id: 'receipt', label: 'Receipt', description: 'Transactional confirmation' },
  { id: 'digest', label: 'Digest', description: 'Multi-section nurture email' },
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
