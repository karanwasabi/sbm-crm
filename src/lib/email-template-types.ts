export type EmailTemplateClassification = 'transactional' | 'marketing';

export type EmailTemplateStatus = 'draft' | 'active' | 'archived';

export type GrapesProjectData = Record<string, unknown>;

export type EmailVariable = {
  token: string;
  label: string;
  /** When set, the chip is only shown for these template classifications. */
  classifications?: EmailTemplateClassification[];
};

export const EMAIL_VARIABLES: EmailVariable[] = [
  { token: '{{lead.first_name}}', label: 'First name' },
  { token: '{{lead.last_name}}', label: 'Last name' },
  { token: '{{lead.full_name}}', label: 'Full name' },
  { token: '{{lead.email}}', label: 'Email' },
  { token: '{{lead.city}}', label: 'City' },
  { token: '{{lead.country}}', label: 'Country' },
  { token: '{{lead.program_interest}}', label: 'Program interest' },
  { token: '{{lead.batch}}', label: 'Batch' },
  { token: '{{referrer.first_name}}', label: 'Referrer first name' },
  { token: '{{referrer.last_name}}', label: 'Referrer last name' },
  { token: '{{referrer.full_name}}', label: 'Referrer full name' },
  { token: '{{referrer.email}}', label: 'Referrer email' },
  { token: '{{member.program_name}}', label: 'Program name', classifications: ['transactional'] },
  { token: '{{member.cohort_name}}', label: 'Cohort name', classifications: ['transactional'] },
  { token: '{{member.cohort_starts_on}}', label: 'Cohort start date', classifications: ['transactional'] },
  { token: '{{member.enrollment_status}}', label: 'Enrollment status', classifications: ['transactional'] },
  { token: '{{member.access_until}}', label: 'Access until', classifications: ['transactional'] },
  { token: '{{renewal.category}}', label: 'Renewal category', classifications: ['transactional'] },
  { token: '{{renewal.category_label}}', label: 'Renewal category label', classifications: ['transactional'] },
  { token: '{{renewal.plan_key}}', label: 'Renewal plan key', classifications: ['transactional'] },
  { token: '{{renewal.plan_label}}', label: 'Renewal plan label', classifications: ['transactional'] },
  { token: '{{renewal.access_until}}', label: 'Renewal access until', classifications: ['transactional'] },
  {
    token: '{{renewal.access_until_label}}',
    label: 'Renewal access until (formatted)',
    classifications: ['transactional'],
  },
  { token: '{{renewal.cohort_name}}', label: 'Renewal cohort', classifications: ['transactional'] },
  { token: '{{renewal.program_name}}', label: 'Renewal program', classifications: ['transactional'] },
  { token: '{{renewal.amount}}', label: 'Renewal amount', classifications: ['transactional'] },
  { token: '{{renewal.months}}', label: 'Renewal months', classifications: ['transactional'] },
  { token: '{{renewal.discount_label}}', label: 'Renewal discount', classifications: ['transactional'] },
  { token: '{{renewal.promo_code}}', label: 'Renewal promo code', classifications: ['transactional'] },
  { token: '{{links.portal}}', label: 'Portal link' },
  { token: '{{links.website}}', label: 'Website link' },
  { token: '{{links.unsubscribe}}', label: 'Unsubscribe link', classifications: ['marketing'] },
];

export function emailVariablesForClassification(classification: EmailTemplateClassification): EmailVariable[] {
  return EMAIL_VARIABLES.filter((variable) => {
    if (!variable.classifications || variable.classifications.length === 0) {
      return true;
    }
    return variable.classifications.includes(classification);
  });
}

export const MARKETING_CONTACT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'N/A',
  eligible: 'Eligible',
  active: 'Subscribed',
  no_consent: 'No consent',
  unsubscribed: 'Unsubscribed',
};
