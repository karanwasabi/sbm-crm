export type AutomationTriggerType = 'lead_created' | 'stage_changed' | 'checkout_started';

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';

export type AutomationNodeType = 'trigger' | 'condition_group' | 'wait' | 'send_email' | 'end';

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
  testMode: boolean;
  enrolledAt: string;
  completedAt?: string;
};

export const AUTOMATION_CONDITION_FIELDS = [
  { value: 'lifecycle_stage', label: 'Lifecycle stage' },
  { value: 'program_interest', label: 'Program interest' },
  { value: 'medium', label: 'Medium' },
  { value: 'manual_source', label: 'Manual source' },
  { value: 'marketing_contact_status', label: 'Marketing contact status' },
  { value: 'consent_status', label: 'Has DPDP consent' },
  { value: 'has_enrollment', label: 'Has enrollment' },
  { value: 'has_checkout', label: 'Started checkout' },
  { value: 'has_payment', label: 'Payment received' },
  { value: 'days_since_created', label: 'Days since created' },
  { value: 'tag', label: 'Tag' },
] as const;

export const LIFECYCLE_STAGE_OPTIONS = [
  'inquiry',
  'engaged',
  'registered',
  'newbie',
  'member',
  'grace',
  'lapsed',
  'lost',
] as const;

export const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  lead_created: 'Lead created',
  stage_changed: 'Stage changed',
  checkout_started: 'Checkout started',
};

export type AutomationStageTriggerConfig = {
  from_stage?: string;
  to_stage?: string;
};

export function defaultStageTriggerConfig(): AutomationStageTriggerConfig {
  return { from_stage: 'inquiry', to_stage: 'engaged' };
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
      return 'Conditions';
    case 'wait':
      return 'Wait';
    case 'send_email':
      return 'Send email';
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
