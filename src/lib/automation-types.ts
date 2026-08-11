import type { LifecycleStage } from '@/types/crm';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';

export type AutomationTriggerType =
  | 'lead_created'
  | 'tag_added'
  | 'stage_changed'
  | 'checkout_started'
  | 'renewal_payment_received'
  | 'referral_submitted'
  | 'referrer_referral_submitted';

export type AutomationChannel = 'email' | 'whatsapp';

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';

export type AutomationNodeType = 'trigger' | 'condition_group' | 'wait' | 'send_email' | 'send_whatsapp' | 'end';

export type AutomationCondition = {
  field: string;
  operator: string;
  value: string | boolean | number;
};

export type AutomationConditionGroupData = {
  logic: 'and' | 'or';
  conditions: AutomationCondition[];
};

export type AutomationWaitData = {
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days' | 'weeks';
};

export type AutomationSendEmailData = {
  template_id: string;
};

export type AutomationSendWhatsAppData = {
  template_id: string;
};

export type AutomationTriggerData = {
  trigger_type: AutomationTriggerType;
  config?: Record<string, string>;
};

export type AutomationGraphNode = {
  id: string;
  type: AutomationNodeType;
  position: { x: number; y: number };
  data:
    | AutomationTriggerData
    | AutomationConditionGroupData
    | AutomationWaitData
    | AutomationSendEmailData
    | AutomationSendWhatsAppData
    | Record<string, never>;
};

export type AutomationGraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'true' | 'false' | '';
};

export type AutomationGraph = {
  nodes: AutomationGraphNode[];
  edges: AutomationGraphEdge[];
};

export type Automation = {
  id: string;
  name: string;
  description: string;
  channel: AutomationChannel;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  graphJson: AutomationGraph;
  status: AutomationStatus;
  graphVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type AutomationEnrollment = {
  id: string;
  automationId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  lifecycleStage: string;
  status: string;
  currentNodeId: string;
  nextRunAt?: string;
  enrolledAt: string;
  completedAt?: string;
};

export type AutomationRunLogEntry = {
  id: number;
  nodeId: string;
  nodeType: string;
  outcome: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export const AUTOMATION_CONDITION_FIELDS = [
  { value: 'lifecycle_stage', label: 'Stage' },
  { value: 'manual_source', label: 'Lead source' },
  { value: 'has_enrollment', label: 'Has enrollment' },
  { value: 'has_checkout', label: 'Started checkout' },
  { value: 'has_payment', label: 'Payment received' },
  { value: 'tag', label: 'Tag' },
] as const;

export const TAG_CONDITION_OPERATORS = [
  { value: 'equals', label: 'Has tag' },
  { value: 'not_equals', label: 'Does not have tag' },
] as const;

export const DEFAULT_CONDITION_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
] as const;

export const CONDITION_LOGIC_OPTIONS = [
  { value: 'and', label: 'All of these are true' },
  { value: 'or', label: 'Any of these is true' },
] as const;

export const WAIT_UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
] as const;

export const BOOLEAN_CONDITION_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

export const LIFECYCLE_STAGE_OPTIONS = [
  'inquiry',
  'engaged',
  'registered',
  'newbie',
  'member',
  'grace',
  'lapsed',
  'transferred',
  'lost',
] as const;

export const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  lead_created: 'New lead added',
  tag_added: 'Tag added',
  stage_changed: 'Stage changes',
  checkout_started: 'Checkout started',
  renewal_payment_received: 'Renewal payment received',
  referral_submitted: 'Referral submitted',
  referrer_referral_submitted: 'Referrer referral submitted',
};

export type AutomationRenewalTriggerConfig = {
  /** Legacy single-category filter; still honored when loading old automations. */
  renewal_category?: string;
  /** When set, workflow runs if payment category matches any listed slug (OR). */
  renewal_categories?: string[];
};

/** Payable renew categories for trigger filtering (excludes autopay-only paths). */
export const RENEW_PAYABLE_CATEGORIES = [
  'new_user',
  'new_lead_no_sub',
  'returnee_no_sub',
  'old_student_active_renew',
  'trial_extend',
  'newbie_manual_renew',
  'member_manual_renew',
] as const;

export const RENEW_CATEGORY_LABELS: Record<string, string> = {
  new_user: 'New user (trial)',
  new_lead_no_sub: 'Lead without subscription (trial)',
  returnee_no_sub: 'Returnee',
  old_student_active_renew: 'Old student active renewal',
  trial_extend: 'Trial extension',
  newbie_manual_renew: 'Newbie manual renewal',
  member_manual_renew: 'Member manual renewal',
};

/** Sidebar copy when the renewal payment received trigger is selected. */
export const RENEWAL_PAYMENT_TRIGGER_DESCRIPTION =
  'Runs after someone successfully pays on /renew and their membership is updated — not when they open the page or when a card attempt fails.';

export const RENEW_ANY_CATEGORY_DESCRIPTION =
  'No filter — runs for every successful /renew payment in any category listed below.';

export const RENEW_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  new_user:
    'Email is not in CRM yet. They are starting Take Control via trial checkout on /renew (1- or 3-month prepaid).',
  new_lead_no_sub:
    'Lead exists in CRM but has no active membership and is not tagged as an old student. Trial checkout on /renew (1- or 3-month prepaid).',
  returnee_no_sub:
    'Membership has lapsed, or they are on the old-student list, with autopay off. Comeback renew: 1-month (often with autopay) or prepaid 3 / 6 / 12 months.',
  old_student_active_renew:
    'OLD-STUDENTS tag or source, still has active access today, autopay off. Extending membership before access ends.',
  trial_extend:
    'On the 1-month trial, paid fewer than 3 trial months, not yet on monthly billing. Pays to extend trial (and optionally bundle prepaid renewal).',
  newbie_manual_renew:
    'Active member, autopay off, not yet on monthly billing. Prepaid extension for 3 / 6 / 12 months.',
  member_manual_renew: 'Active monthly member with autopay off. Prepaid extension for 3 / 6 / 12 months.',
};

export function isRenewPayableCategory(slug: string): boolean {
  return (RENEW_PAYABLE_CATEGORIES as readonly string[]).includes(slug.trim());
}

export function parseRenewalTriggerCategories(
  raw?: Record<string, unknown> | AutomationRenewalTriggerConfig | null
): string[] {
  const fromArray = raw?.renewal_categories;
  const categories: string[] = [];

  if (Array.isArray(fromArray)) {
    for (const item of fromArray) {
      const slug = String(item).trim();
      if (slug && isRenewPayableCategory(slug)) {
        categories.push(slug);
      }
    }
  }

  const legacy = raw?.renewal_category;
  if (legacy != null && String(legacy).trim() !== '') {
    const slug = String(legacy).trim();
    if (isRenewPayableCategory(slug)) {
      categories.push(slug);
    }
  }

  return [...new Set(categories)];
}

export function renewCategoryDescription(category: string): string {
  const slug = category.trim();
  if (!slug) return RENEW_ANY_CATEGORY_DESCRIPTION;
  return RENEW_CATEGORY_DESCRIPTIONS[slug] ?? slug;
}

export function renewalCategoriesFilterLabel(categories: string[]): string {
  if (categories.length === 0) return 'Any renew category';
  if (categories.length === 1) {
    return RENEW_CATEGORY_LABELS[categories[0]] ?? categories[0];
  }
  return `${categories.length} renew categories`;
}

export function buildRenewalTriggerConfig(categories: string[]): Record<string, unknown> {
  const unique = [...new Set(categories.filter(isRenewPayableCategory))];
  if (unique.length === 0) return {};
  return { renewal_categories: unique };
}

export function normalizeRenewalTriggerConfig(raw?: Record<string, unknown> | AutomationRenewalTriggerConfig | null): {
  renewal_categories: string[];
} {
  return { renewal_categories: parseRenewalTriggerCategories(raw) };
}

export const RENEW_CATEGORY_SELECT_OPTIONS = RENEW_PAYABLE_CATEGORIES.map((value) => ({
  value,
  label: RENEW_CATEGORY_LABELS[value] ?? value,
}));

export type AutomationTagTriggerConfig = {
  tag?: string;
};

/** Parse saved tag_added trigger config. Empty tag = "Any tag". */
export function normalizeTagTriggerConfig(
  raw?: Record<string, unknown> | AutomationTagTriggerConfig | null
): Record<string, string> {
  const tag = raw?.tag;
  return {
    tag: tag != null && String(tag).trim() !== '' ? String(tag).trim() : '',
  };
}

export function lifecycleStageLabel(slug: string): string {
  if (slug in LIFECYCLE_STAGES) {
    return LIFECYCLE_STAGES[slug as LifecycleStage].label;
  }
  return slug;
}

export const LIFECYCLE_STAGE_SELECT_OPTIONS = LIFECYCLE_STAGE_OPTIONS.map((stage) => ({
  value: stage,
  label: lifecycleStageLabel(stage),
}));

export function resolveStepLabel(graph: AutomationGraph | undefined, nodeId: string | null | undefined): string {
  if (!nodeId?.trim()) return '—';
  const node = graph?.nodes.find((item) => item.id === nodeId);
  if (node) return nodeLabel(node.type);
  return '—';
}

export type AutomationStageTriggerConfig = {
  from_stage?: string;
  to_stage?: string;
};

export function defaultStageTriggerConfig(): AutomationStageTriggerConfig {
  return { from_stage: 'inquiry', to_stage: 'engaged' };
}

/** Parse saved stage trigger config. Empty string = "Any stage" (not a default). */
export function normalizeStageTriggerConfig(
  raw?: Record<string, unknown> | AutomationStageTriggerConfig | null,
  options?: { applyDefaults?: boolean }
): Record<string, string> {
  const applyDefaults = options?.applyDefaults ?? false;
  if (applyDefaults && (!raw || Object.keys(raw).length === 0)) {
    const defaults = defaultStageTriggerConfig();
    return {
      from_stage: defaults.from_stage ?? '',
      to_stage: defaults.to_stage ?? '',
    };
  }

  const from = raw?.from_stage;
  const to = raw?.to_stage;
  return {
    from_stage: from != null && String(from).trim() !== '' ? String(from) : '',
    to_stage: to != null && String(to).trim() !== '' ? String(to) : '',
  };
}

export function defaultAutomationGraph(triggerType: AutomationTriggerType = 'lead_created'): AutomationGraph {
  return {
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 80, y: 80 },
        data: { trigger_type: triggerType },
      },
      {
        id: 'wait-1',
        type: 'wait',
        position: { x: 80, y: 220 },
        data: { duration_value: 24, duration_unit: 'hours' },
      },
      {
        id: 'cond-1',
        type: 'condition_group',
        position: { x: 80, y: 360 },
        data: {
          logic: 'and',
          conditions: [{ field: 'lifecycle_stage', operator: 'equals', value: 'inquiry' }],
        },
      },
      {
        id: 'send-1',
        type: 'send_email',
        position: { x: -40, y: 520 },
        data: { template_id: '' },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 240, y: 520 },
        data: {},
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'wait-1' },
      { id: 'e2', source: 'wait-1', target: 'cond-1' },
      { id: 'e3', source: 'cond-1', target: 'send-1', sourceHandle: 'true' },
      { id: 'e4', source: 'cond-1', target: 'end-1', sourceHandle: 'false' },
    ],
  };
}

export function deriveAutomationChannel(graph: AutomationGraph): AutomationChannel {
  const hasEmail = graph.nodes.some((node) => node.type === 'send_email');
  const hasWhatsApp = graph.nodes.some((node) => node.type === 'send_whatsapp');
  if (hasWhatsApp && !hasEmail) {
    return 'whatsapp';
  }
  return 'email';
}

export function automationStatusLabel(status: AutomationStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Inactive';
    case 'archived':
      return 'Archived';
    default:
      return 'Draft';
  }
}

export function automationStatusPillTone(status: AutomationStatus): 'success' | 'warn' | 'neutral' | 'brand' {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warn';
    case 'archived':
      return 'neutral';
    default:
      return 'brand';
  }
}

export function nodeLabel(type: AutomationNodeType): string {
  switch (type) {
    case 'trigger':
      return 'Trigger';
    case 'condition_group':
      return 'Rules';
    case 'wait':
      return 'Wait';
    case 'send_email':
      return 'Send email';
    case 'send_whatsapp':
      return 'Send WhatsApp';
    case 'end':
      return 'End';
    default:
      return type;
  }
}

export function validationIssueDisplay(
  issue: { node_id: string; message: string },
  nodeType?: AutomationNodeType
): string {
  if (!issue.node_id) {
    return issue.message;
  }
  const step = nodeType ? nodeLabel(nodeType) : 'Step';
  return `${step}: ${issue.message}`;
}

export function automationEnrollmentStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'waiting':
      return 'Waiting';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function automationRunOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'email_sent':
      return 'Email step';
    case 'whatsapp_sent':
      return 'WhatsApp step';
    case 'waiting':
      return 'Scheduled wait';
    case 'wait_completed':
      return 'Wait finished';
    case 'condition_evaluated':
      return 'Conditions checked';
    case 'completed':
      return 'Finished';
    case 'send_failed':
      return 'Send failed';
    default:
      return outcome.replaceAll('_', ' ');
  }
}

export function formatAutomationRunDetails(details: Record<string, unknown>): string | null {
  if (typeof details.skip_reason === 'string' && details.skip_reason) {
    return `Skipped: ${details.skip_reason}`;
  }
  if (details.match === true) {
    return 'Went to Yes branch';
  }
  if (details.match === false) {
    return 'Went to No branch';
  }
  if (typeof details.until === 'string') {
    return `Continues after ${new Date(details.until).toLocaleString()}`;
  }
  if (typeof details.template_id === 'string' && details.template_id) {
    return 'Email template selected';
  }
  return null;
}
