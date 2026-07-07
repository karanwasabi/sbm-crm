import type { ManualLeadSource } from '@/types/crm';

export const LEAD_SOURCE_LABELS: Record<ManualLeadSource, string> = {
  cr_handle: 'CR Handle Leads',
  meta: 'Meta Leads',
  quad: 'Quad Leads',
  referral: 'Referral Leads',
  interest_form: 'Interest Form Leads',
  old_students: 'Old Students',
  other: 'Other Leads',
  portal_signup: 'Portal Signup',
  trial_1m_signup: 'Enroll 1 Month',
  trial_3m_signup: 'Enroll 3 Months',
};

const LEGACY_SOURCE_LABELS: Record<string, string> = {
  walk_in: 'Other Leads',
  event_booth: 'Other Leads',
  phone_enquiry: 'CR Handle Leads',
  lead_intake_form: 'Interest Form Leads',
  website: 'Other Leads',
  whatsapp: 'Other Leads',
  google: 'Other Leads',
  portal_signup: 'Portal Signup',
  assisted_portal_signup: 'Assisted Portal Signup',
  trial_1m_signup: 'Enroll 1 Month',
  trial_3m_signup: 'Enroll 3 Months',
};

export function leadSourceLabel(source: string | null | undefined): string {
  if (!source?.trim()) {
    return '';
  }
  const key = source.trim();
  if (key in LEAD_SOURCE_LABELS) {
    return LEAD_SOURCE_LABELS[key as ManualLeadSource];
  }
  return LEGACY_SOURCE_LABELS[key] ?? key;
}
