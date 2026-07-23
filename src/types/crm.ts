export type LifecycleStage =
  | 'inquiry'
  | 'engaged'
  | 'registered'
  | 'newbie'
  | 'member'
  | 'grace'
  | 'lapsed'
  | 'transferred'
  | 'lost';

export type LeadMedium = 'paid' | 'organic' | 'offline';

export type ManualLeadSource =
  | 'cr_handle'
  | 'meta'
  | 'quad'
  | 'referral'
  | 'interest_form'
  | 'old_students'
  | 'other'
  | 'portal_signup'
  | 'trial_1m_signup'
  | 'trial_3m_signup';

export const MANUAL_LEAD_SOURCE_OPTIONS: { value: ManualLeadSource; label: string }[] = [
  { value: 'cr_handle', label: 'CR Handle Leads' },
  { value: 'meta', label: 'Meta Leads' },
  { value: 'quad', label: 'Quad Leads' },
  { value: 'referral', label: 'Referral Leads' },
  { value: 'interest_form', label: 'Interest Form Leads' },
  { value: 'old_students', label: 'Old Students' },
  { value: 'other', label: 'Other Leads' },
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
  medium: LeadMedium;
  sourceLabel: string;
  interest: string;
  batch: string;
  systemTags: string[];
  manualTags: string[];
  tags: string[];
  enriched: boolean;
  dedup: boolean;
  phoneDuplicate: boolean;
  phoneDuplicateCount: number;
  addedAt: string;
  updatedAt: string;
  marketingContactStatus: import('@/types/crm').MarketingContactStatus;
  marketingContactSyncedAt?: string | null;
  marketingUnsubscribedAt?: string | null;
  unseenSuggestionCount: number;
  memberKind?: 'renewal' | 'returnee' | null;
};

export type LeadSummary = {
  total: number;
  byStage: Record<LifecycleStage, number>;
  withUnseenSuggestions: number;
};

export type LeadFilterOption = {
  value: string;
  label?: string;
  count: number;
};

export type LeadFilterOptions = {
  programs: LeadFilterOption[];
  batches: LeadFilterOption[];
  geography: LeadFilterOption[];
  sources: LeadFilterOption[];
  coaches: LeadFilterOption[];
};

export type LeadListResult = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MarketingContactStatus = 'not_applicable' | 'no_consent' | 'eligible' | 'active' | 'unsubscribed';

export type CreateLeadInput = {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  country_code?: string;
  city?: string;
  manual_source: ManualLeadSource;
  notes?: string;
  manual_tags?: string[];
  dpdp_consent: boolean;
  force_separate?: boolean;
};

export type FieldSuggestion = {
  id: number;
  field: 'name' | 'phone' | 'city' | 'country';
  currentValue: string;
  suggestedValue: string;
  source: 'leadsync' | 'native_meta' | 'manual_intake' | 'phone_match' | 'lead_intake_form';
  sourceLabel: string;
  contactEventId?: number | null;
  editable: boolean;
  status: 'pending' | 'dismissed' | 'applied';
  lastSeenAt: string;
  seenAt?: string | null;
};

export type ContactDuplicate = {
  linkId: number;
  otherLeadId: string;
  otherLeadName: string;
  otherLeadEmail: string;
  otherLeadPhone: string;
  otherLeadStage: LifecycleStage;
  matchType: 'phone' | 'email';
  matchValue: string;
  isPayingMember: boolean;
};

export type ManualIntakeRecord = {
  id: number;
  recordedAt: string;
  mode: 'attach_inquiry' | 'profile';
  sourceLabel: string;
  profileName?: string;
  profileEmail?: string;
  profilePhone?: string;
  profileCity?: string;
  profileCountry?: string;
  nameEntered?: string;
  emailEntered?: string;
  phoneEntered?: string;
  cityEntered?: string;
  countryEntered?: string;
  tagsAdded?: string[];
  profileFieldsUpdated?: string[];
  staffNotes?: string;
};

export type IntakeFieldConflict = {
  field: string;
  currentValue: string;
  intakeValue: string;
  mergeAllowed: boolean;
};

export type IntakeMergeOptions = {
  profileMergeAllowed: boolean;
  allowedFields: string[];
  attachInquiryOnly: boolean;
  blockReason?: string;
  targetIsPayingMember: boolean;
};

export type IntakeDuplicateCheckResult = {
  matchFound: boolean;
  matchType?: 'email' | 'phone';
  existing?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    stage: LifecycleStage;
    isPaying: boolean;
  };
  conflicts?: IntakeFieldConflict[];
  mergeOptions?: IntakeMergeOptions;
};

export type IntakeForm = {
  id: string;
  slug: string;
  name: string;
  title: string;
  description?: string;
  formTag: string;
  extraTags: string[];
  showCountry: boolean;
  showCity: boolean;
  showNotes: boolean;
  status: 'active' | 'archived';
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type UpsertIntakeFormInput = {
  name: string;
  title: string;
  description?: string;
  extra_tags?: string[];
  show_country: boolean;
  show_city: boolean;
  show_notes: boolean;
};

export type TagSuggestion = {
  slug: string;
  label: string;
};

export type TagFilterMode = 'and' | 'or';

export type CreateLeadState = {
  error: string | null;
  success: boolean;
};

export type ContactOutcome = 'interested' | 'busy' | 'no_answer' | 'not_interested' | 'wrong_number';

export const CONTACT_OUTCOME_OPTIONS: { value: ContactOutcome; label: string }[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'busy', label: 'Busy / call back later' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'wrong_number', label: 'Wrong number' },
];

export function contactOutcomeMarksLost(outcome: ContactOutcome): boolean {
  return outcome === 'not_interested' || outcome === 'wrong_number';
}

export type LeadDetail = Lead & {
  manualSource: ManualLeadSource;
  notes: string;
  memberUserId: string | null;
  memberKind: 'renewal' | 'returnee' | null;
  canMarkLost: boolean;
  canPurge: boolean;
  canOfflineEnroll: boolean;
  canTransferMembership?: boolean;
  paymentPending: PaymentPending | null;
  attribution: LeadAttribution | null;
  fieldSuggestions: FieldSuggestion[];
  contactDuplicates: ContactDuplicate[];
  manualIntakeRecords: ManualIntakeRecord[];
  timeline: TimelineEvent[];
  coachName?: string | null;
};

export type MembershipTransferMatch = 'none' | 'lead_only' | 'user_only' | 'lead_and_user';

export type MembershipTransferOverwriteField = 'first_name' | 'last_name' | 'email' | 'whatsapp';

export type MembershipTransferOverwriteCandidate = {
  current: string | null;
  proposed: string;
  conflict: boolean;
};

export type MembershipTransferOverwriteCandidates = Record<
  MembershipTransferOverwriteField,
  MembershipTransferOverwriteCandidate
>;

export type MembershipTransferOverwriteFlags = Record<MembershipTransferOverwriteField, boolean>;

export type MembershipTransferIdentityInput = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
};

export type MembershipTransferPreviewRequest = MembershipTransferIdentityInput;

export type MembershipTransferDonorSummary = {
  leadId: string;
  userId: string | null;
  enrollmentId: string | null;
  cohortId: string | null;
  cohortName: string | null;
  accessUntil: string | null;
  razorpayCustomerIds: string[];
};

export type MembershipTransferRazorpayConflict = {
  customerId: string;
  status: 'idle' | 'live';
  resolveRequired: boolean;
  message?: string | null;
};

export type MembershipTransferPreviewResponse = {
  donor: MembershipTransferDonorSummary;
  match: MembershipTransferMatch;
  overwriteCandidates: MembershipTransferOverwriteCandidates;
  razorpayConflict: MembershipTransferRazorpayConflict | null;
  blockingErrors: string[];
  canApply: boolean;
};

export type MembershipTransferApplyRequest = MembershipTransferIdentityInput & {
  overwrite: MembershipTransferOverwriteFlags;
  confirmExisting: boolean;
  resolveRazorpayConflict: boolean;
};

export type MembershipTransferApplyResult = {
  status: 'transferred' | 'failed';
  donorLeadId?: string;
  recipientLeadId?: string;
  rolledBack?: boolean;
  error?: string | null;
  razorpay?: {
    status: string;
    customerIds: string[];
    parkedCustomerId: string | null;
  } | null;
  razorpayConflict?: MembershipTransferRazorpayConflict | null;
  razorpayErrors?: string[];
};

export type PaymentPending = {
  checkoutSessionId: string;
  programName: string;
  cohortName: string;
  amountPaise: number;
};

export type OfflineEnrollCohort = {
  id: string;
  name: string;
  startsOn: string;
};

export type ContactProfile = {
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
  manualSourceLabel: string;
  notes: string;
  isMember: boolean;
  canMarkLost: boolean;
  canPurge: boolean;
  marketingContactStatus: MarketingContactStatus;
  marketingContactSyncedAt?: string | null;
  marketingUnsubscribedAt?: string | null;
  clv?: string;
  programs?: number;
  loggingPct?: number;
  coachName?: string | null;
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
  stage: string;
  label: string;
  count: number;
  color: string;
  tint: string;
};

export type SourcePerformanceRow = {
  source: string;
  medium: LeadMedium;
  leads: number;
  paid: number;
  cvr: number;
  cpl: number | null;
  cac: number | null;
};

export type MetaCampaignPerformanceRow = {
  campaignId: string;
  campaignName: string;
  leads: number;
  paid: number;
  spend: number | null;
  cvr: number;
  cpl: number | null;
  cac: number | null;
};

export type AdPerformanceRow = {
  adContent: string;
  adset: string;
  program: string;
  campaign: string;
  leads: number;
  paid: number;
  cvr: number;
};

export type MetaIntegrationStatus = {
  connected: boolean;
  provider: string | null;
  automationAvailable: boolean;
  webhookConfigured: boolean;
  webhookUrl: string;
  leadsToday: number;
  lastSyncAt: string | null;
  metaLeadsTotal: number;
  metaLeads7d: number;
};

export type RazorpayIntegrationStatus = {
  configured: boolean;
  webhookConfigured: boolean;
};

export type LeadAttribution = {
  source: string;
  sourceLabel: string;
  integration: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  formId: string | null;
  metaFormName: string | null;
  intakeFormTitle: string | null;
  intakeFormName: string | null;
  platform: string | null;
  externalId: string | null;
};

export type RevenueWeek = {
  week: string;
  revenue: number;
};

export type DashboardAnalytics = {
  kpis: {
    newLeads7d: number;
    newLeadsPrev7d: number;
    totalLeads: number;
    conversionRate: number;
    activeMembers: number;
    activeCohorts: number;
    revenueMtdPaise: number;
    revenuePrevMtdPaise: number;
    renewalsAtRisk: number;
  };
  newLeadsSparkline: number[];
  funnel: Array<{ stage: string; label: string; count: number }>;
  revenueWeekly: Array<{ weekLabel: string; revenueLakhs: number }>;
  geo: Array<{ label: string; count: number; pct: number }>;
};

export type GeoItem = {
  city: string;
  pct: number;
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
  occurredAt?: string;
  color: string;
};

export const TIMELINE_KIND_LABELS: Record<TimelineEvent['kind'], string> = {
  op: 'Operations',
  comms: 'Communications',
};

export type ProgramHistoryItem = {
  id: string;
  program: string;
  batch: string;
  status: string;
  amount: string;
  date: string;
  promoCode?: string | null;
  phase?: string | null;
  startsOn?: string | null;
  accessUntil?: string | null;
  graceUntil?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  subscriptionStatus?: string | null;
  recurringStartAt?: string | null;
  /** True for the enrollment that drives lead lifecycle stage (latest paid checkout). */
  drivesLifecycle?: boolean;
};

export type CohortSummary = {
  id: string;
  programId: string;
  name: string;
  startsOn: string;
  status: string;
  phaseLabel: string;
  memberCount: number;
  canEdit: boolean;
  canEditStartsOn: boolean;
  color: string;
};

export type CohortDetail = CohortSummary & {
  programName: string;
  paidMemberCount: number;
  pointAEnabled?: boolean;
  pointAEffective?: boolean;
  canEditPointAEnabled?: boolean;
  isDemo?: boolean;
  canEditIsDemo?: boolean;
  canDelete?: boolean;
  canArchive?: boolean;
  cleanupBlockers?: string[];
};

export type CohortMember = {
  enrollmentId: string;
  userId: string;
  leadId?: string;
  memberName: string;
  memberInitials: string;
  email: string;
  whatsapp: string;
  city: string;
  countryCode: string;
  countryName: string;
  sex?: string | null;
  timezoneId: string;
  timezoneLabel: string;
  enrollmentStatus: string;
  memberPhase: string;
  subscriptionState: 'active' | 'lapsed' | 'transferred';
  subscriptionStatus?: string;
  lifecycleStage?: string;
  memberKind?: 'renewal' | 'returnee';
  enrolledAt: string;
  /** ISO timestamp when app onboarding finished; null if incomplete. */
  onboardingCompletedAt: string | null;
  coachUserId?: string | null;
  coachName?: string | null;
  /** Superadmin-only body metrics from member profile. */
  heightCm?: number | null;
  initialWeightKg?: number | null;
  bmi?: number | null;
};

/** @deprecated Use CohortSummary */
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

export type RenewalRetentionBucket = 'healthy' | 'cancelling' | 'payment_issue' | 'churned';

export type RenewalRisk = 'high' | 'med' | 'low';

export type RenewalSummary = {
  atRiskCount: number;
  atRiskMrrPaise: number;
  cancellingCount: number;
  paymentIssueCount: number;
  churnedCount: number;
  churnedThisMonth: number;
  autoRenewedThisMonth: number;
  healthyCount: number;
  nextCancellingLeadId?: string | null;
  nextCancellingName?: string | null;
  nextCancellingAccessAt?: string | null;
};

export type RenewalRow = {
  checkoutSessionId: string;
  userId: string;
  leadId?: string | null;
  memberName: string;
  memberInitials: string;
  programName: string;
  cohortName: string;
  nextChargeAt?: string | null;
  accessUntil?: string | null;
  monthlyTotalPaise: number;
  lifetimePaidPaise: number;
  retentionBucket: RenewalRetentionBucket;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodSummary?: string;
  risk: RenewalRisk;
  daysUntilCharge?: number | null;
};

export type RenewalAction = {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  accent: string;
  cta?: string;
  href?: string;
  bucket?: 'cancelling' | 'payment_issue' | 'churned';
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
