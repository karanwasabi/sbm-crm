export type LifecycleStage = 'inquiry' | 'engaged' | 'registered' | 'active' | 'completed' | 'renewal' | 'lost';

export type LeadMedium = 'paid' | 'organic' | 'offline';

export type ManualLeadSource = 'walk_in' | 'event_booth' | 'phone_enquiry' | 'referral' | 'other';

export const MANUAL_LEAD_SOURCE_OPTIONS: { value: ManualLeadSource; label: string }[] = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'event_booth', label: 'Event booth' },
  { value: 'phone_enquiry', label: 'Phone enquiry' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  countryCode: string;
  city: string;
  stage: LifecycleStage;
  interest: string;
  batch: string;
  tags: string[];
  enriched: boolean;
  dedup: boolean;
  addedAt: string;
};

export type LeadSummary = {
  total: number;
  byStage: Record<LifecycleStage, number>;
};

export type CreateLeadInput = {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  country_code?: string;
  city?: string;
  manual_source: ManualLeadSource;
  notes?: string;
  dpdp_consent: boolean;
};

export type CreateLeadState = {
  error: string | null;
  success: boolean;
};

export type StaffUser = {
  name: string;
  initials: string;
  role: string;
  location: string;
};

export type DashboardKpi = {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent: string;
  spark?: number[];
};

export type FunnelStep = {
  label: string;
  count: number;
  color: string;
};

export type SourcePerformanceRow = {
  source: string;
  medium: LeadMedium;
  leads: number;
  paid: number;
  cvr: number;
  cac: number;
};

export type RevenueWeek = {
  week: string;
  revenue: number;
  spend: number;
};

export type GeoItem = {
  city: string;
  pct: number;
  color: string;
};

export type CommsHealthItem = {
  channel: string;
  sent: number;
  delivered: number;
  openRate: number;
  color: string;
};

export type IntegrationStatus = 'connected' | 'warning' | 'error';

export type Integration = {
  id: string;
  name: string;
  subtitle: string;
  status: IntegrationStatus;
  color: string;
};

export type InboundLead = {
  id: string;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  time: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  joinedAt: string;
  stage: LifecycleStage;
  batch: string;
  tags: string[];
  clv: string;
  programs: number;
  loggingPct: number;
};

export type TimelineEvent = {
  id: string;
  kind: 'op' | 'comms';
  title: string;
  body?: string;
  meta: string;
  color: string;
};

export type ProgramHistoryItem = {
  program: string;
  batch: string;
  status: string;
  amount: string;
  date: string;
};

export type CohortCapacity = {
  name: string;
  color: string;
  week: string;
  enrolled: number;
  cap: number;
  waitlist: number;
  badge?: string;
};

export type AttendanceRow = {
  name: string;
  cohort: string;
  sessions: number;
  total: number;
  pct: number;
  status: string;
};

export type CommunicationRule = {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  active: boolean;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: string;
  lastUsed: string;
};

export type CampaignSequence = {
  id: string;
  name: string;
  steps: number;
  enrolled: number;
  status: string;
};

export type RenewalRow = {
  id: string;
  name: string;
  program: string;
  dueDate: string;
  amount: string;
  status: 'due' | 'achieved' | 'missed';
};

export type RenewalAction = {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  accent: string;
};

export type SettingsIntegration = {
  id: string;
  name: string;
  subtitle: string;
  status: IntegrationStatus;
  color: string;
};

export type ApiKey = {
  id: string;
  label: string;
  key: string;
  masked: boolean;
};
