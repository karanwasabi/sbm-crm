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
  staff: 'Staff',
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
  staff: 'Staff',
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

export function perfSourceLabel(sourceKey: string | null | undefined): string {
  if (!sourceKey?.trim()) {
    return '';
  }
  if (sourceKey === 'meta_influenced') {
    return 'Meta Influenced';
  }
  if (sourceKey === 'meta_influenced_old_students') {
    return 'Old students (Meta)';
  }
  return leadSourceLabel(sourceKey) || sourceKey;
}

/** Options for Lead Database performance-source filter (dashboard drilldown `perf_source`). */
export const PERF_SOURCE_FILTER_OPTIONS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Any' },
  { id: 'meta_influenced', label: 'Meta Influenced' },
  { id: 'meta_influenced_old_students', label: 'Old students (Meta)' },
  { id: 'old_students', label: 'Old Students' },
  { id: 'meta', label: 'Meta Leads' },
  { id: 'interest_form', label: 'Interest Form Leads' },
  { id: 'cr_handle', label: 'CR Handle Leads' },
  { id: 'referral', label: 'Referral Leads' },
  { id: 'quad', label: 'Quad Leads' },
  { id: 'other', label: 'Other Leads' },
];

export const PURCHASE_KIND_FILTER_OPTIONS: Array<{ id: '' | 'new' | 'renewal'; label: string }> = [
  { id: '', label: 'Any' },
  { id: 'new', label: 'New' },
  { id: 'renewal', label: 'Renewal' },
];
