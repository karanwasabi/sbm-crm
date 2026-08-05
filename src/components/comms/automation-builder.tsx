'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailTemplate, Automation, WhatsAppTemplate } from '@/utils/api';
import type {
  AutomationCondition,
  AutomationConditionGroupData,
  AutomationGraph,
  AutomationNodeType,
  AutomationSendEmailData,
  AutomationSendWhatsAppData,
  AutomationTriggerType,
  AutomationWaitData,
} from '@/lib/automation-types';
import {
  AUTOMATION_CONDITION_FIELDS,
  BOOLEAN_CONDITION_OPTIONS,
  CONDITION_LOGIC_OPTIONS,
  DEFAULT_CONDITION_OPERATORS,
  LIFECYCLE_STAGE_SELECT_OPTIONS,
  TAG_CONDITION_OPERATORS,
  TRIGGER_LABELS,
  WAIT_UNIT_OPTIONS,
  defaultAutomationGraph,
  deriveAutomationChannel,
  normalizeStageTriggerConfig,
  normalizeTagTriggerConfig,
  normalizeRenewalTriggerConfig,
  RENEW_CATEGORY_SELECT_OPTIONS,
  nodeLabel,
  validationIssueDisplay,
} from '@/lib/automation-types';
import {
  activateAutomationAction,
  archiveAutomationAction,
  deactivateAutomationAction,
  deleteAutomationAction,
  saveAutomationAction,
  validateAutomationAction,
} from '@/app/(crm)/communications/actions';
import { AutomationConfirmDialog, type AutomationConfirmAction } from '@/components/comms/automation-confirm-dialog';
import { AutomationBuilderSelect } from '@/components/comms/automation-builder-select';
import { WhatsAppTemplateSelect } from '@/components/comms/whatsapp-template-select';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { automationFlowNodeTypes, type BuilderNodeData } from '@/components/comms/automation-flow-nodes';
import type { AutomationValidationIssue } from '@/utils/api';
import { AutomationValidationErrorsContext } from '@/components/comms/automation-validation-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { TagSuggestion } from '@/types/crm';
import { MANUAL_LEAD_SOURCE_OPTIONS } from '@/types/crm';
import { automationStatusLabel, automationStatusPillTone } from '@/lib/automation-types';
import { commsAutomationHref, COMMS_AUTOMATIONS_HREF } from '@/lib/comms-channel';

type BuilderTemplate = { id: string; name: string };

function graphToFlow(
  graph: AutomationGraph,
  templates: BuilderTemplate[]
): { nodes: Node<BuilderNodeData>[]; edges: Edge[] } {
  const templateById = new Map(templates.map((t) => [t.id, t.name]));
  const nodes: Node<BuilderNodeData>[] = graph.nodes.map((node) => {
    let label = nodeLabel(node.type);
    if (node.type === 'trigger') {
      label = TRIGGER_LABELS[(node.data as { trigger_type: AutomationTriggerType }).trigger_type] ?? 'Trigger';
    }
    if (node.type === 'send_email' || node.type === 'send_whatsapp') {
      const templateId = (node.data as AutomationSendEmailData | AutomationSendWhatsAppData).template_id;
      label = templateId ? (templateById.get(templateId) ?? 'Select template') : 'Select template';
    }
    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        nodeType: node.type,
        label,
        config: node.data as Record<string, unknown>,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
    label: edge.sourceHandle === 'true' ? 'Yes' : edge.sourceHandle === 'false' ? 'No' : undefined,
    animated: edge.sourceHandle === 'true',
  }));

  return { nodes, edges };
}

function flowToGraph(nodes: Node<BuilderNodeData>[], edges: Edge[]): AutomationGraph {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.nodeType,
      position: node.position,
      data: node.data.config as AutomationGraph['nodes'][number]['data'],
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: (edge.sourceHandle as 'true' | 'false' | undefined) ?? '',
    })),
  };
}

type AutomationBuilderProps = {
  automation: Automation | null;
  emailTemplates: EmailTemplate[];
  whatsappTemplates?: WhatsAppTemplate[];
  tagSuggestions?: TagSuggestion[];
};

const SUPPORTED_TAG_OPERATORS = new Set<string>(TAG_CONDITION_OPERATORS.map((op) => op.value));
const LOCKED_IS_FIELDS = new Set<string>(['has_enrollment', 'has_checkout', 'has_payment']);
const SUPPORTED_DEFAULT_OPERATORS = new Set<string>(DEFAULT_CONDITION_OPERATORS.map((op) => op.value));

function tagConditionOperator(operator: string): string {
  return SUPPORTED_TAG_OPERATORS.has(operator) ? operator : 'equals';
}

function normalizeTagCondition(condition: AutomationCondition): AutomationCondition {
  if (condition.field !== 'tag' || SUPPORTED_TAG_OPERATORS.has(condition.operator)) {
    return condition;
  }
  return { ...condition, operator: 'equals' };
}

function defaultConditionForField(field: string): Pick<AutomationCondition, 'field' | 'operator' | 'value'> {
  if (field === 'tag') return { field, operator: 'equals', value: '' };
  if (field === 'lifecycle_stage') return { field, operator: 'equals', value: 'inquiry' };
  if (field === 'manual_source') return { field, operator: 'equals', value: '' };
  if (LOCKED_IS_FIELDS.has(field)) return { field, operator: 'equals', value: true };
  return { field, operator: 'equals', value: '' };
}

function defaultConditionOperator(operator: string): string {
  return SUPPORTED_DEFAULT_OPERATORS.has(operator) ? operator : 'equals';
}

function buildTagSelectOptions(tagSuggestions: TagSuggestion[], value: string) {
  const options = tagSuggestions.map((tag) => ({
    value: tag.slug,
    label: tagSlugToLabel(tag.slug),
    searchText: `${tagSlugToLabel(tag.slug)} ${tag.slug}`,
  }));

  const slug = value.trim();
  if (slug && !options.some((option) => option.value === slug)) {
    options.push({
      value: slug,
      label: tagSlugToLabel(slug),
      searchText: slug,
    });
  }

  return options;
}

function buildLeadSourceSelectOptions(value: string) {
  const options: { value: string; label: string; searchText: string }[] = MANUAL_LEAD_SOURCE_OPTIONS.map((source) => ({
    value: source.value,
    label: source.label,
    searchText: `${source.label} ${source.value}`,
  }));

  const sourceValue = value.trim();
  if (sourceValue && !options.some((option) => option.value === sourceValue)) {
    options.push({
      value: sourceValue,
      label: sourceValue,
      searchText: sourceValue,
    });
  }

  return options;
}

export function AutomationBuilder({
  automation,
  emailTemplates,
  whatsappTemplates = [],
  tagSuggestions = [],
}: AutomationBuilderProps) {
  const router = useRouter();
  const allTemplates: BuilderTemplate[] = useMemo(
    () => [
      ...emailTemplates.map((template) => ({ id: template.id, name: template.name })),
      ...whatsappTemplates.map((template) => ({ id: template.id, name: template.name })),
    ],
    [emailTemplates, whatsappTemplates]
  );
  const emailActiveTemplates: BuilderTemplate[] = useMemo(
    () =>
      emailTemplates
        .filter((template) => template.status === 'active')
        .map((template) => ({ id: template.id, name: template.name })),
    [emailTemplates]
  );
  const whatsappActiveTemplates: BuilderTemplate[] = useMemo(
    () =>
      whatsappTemplates
        .filter((template) => template.status === 'active')
        .map((template) => ({ id: template.id, name: template.name })),
    [whatsappTemplates]
  );
  const whatsappTemplatesForSelect = useMemo(
    () => whatsappTemplates.filter((template) => template.status === 'active'),
    [whatsappTemplates]
  );
  const initialGraph = automation?.graphJson ?? defaultAutomationGraph(automation?.triggerType ?? 'lead_created');
  const initialFlow = useMemo(() => graphToFlow(initialGraph, allTemplates), [initialGraph, allTemplates]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(automation?.name ?? 'New nurture workflow');
  const [description, setDescription] = useState(automation?.description ?? '');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(automation?.triggerType ?? 'lead_created');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>(() => {
    if (automation?.triggerType === 'stage_changed') {
      return normalizeStageTriggerConfig(automation.triggerConfig);
    }
    if (automation?.triggerType === 'renewal_payment_received') {
      return normalizeRenewalTriggerConfig(automation.triggerConfig);
    }
    if (!automation) {
      return normalizeStageTriggerConfig(undefined, { applyDefaults: true });
    }
    return Object.fromEntries(
      Object.entries(automation.triggerConfig ?? {}).map(([key, value]) => [key, String(value)])
    );
  });
  const [status, setStatus] = useState(automation?.status ?? 'draft');
  const [message, setMessage] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<AutomationValidationIssue[]>([]);
  const [validationPassed, setValidationPassed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<AutomationConfirmAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const isArchived = status === 'archived';
  const isGraphLocked = status === 'active' || isArchived;

  const invalidateValidation = useCallback(() => {
    setValidationPassed(false);
    setValidationIssues([]);
  }, []);

  const validationErrorByNode = useMemo(() => {
    const map = new Map<string, string>();
    const triggerId = nodes.find((node) => node.data.nodeType === 'trigger')?.id;
    for (const issue of validationIssues) {
      const nodeId = issue.node_id || triggerId;
      if (!nodeId || !issue.message) continue;
      const existing = map.get(nodeId);
      map.set(nodeId, existing ? `${existing} · ${issue.message}` : issue.message);
    }
    return map;
  }, [nodes, validationIssues]);

  const graphStructureKey = useMemo(
    () =>
      JSON.stringify({
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.nodeType,
          config: node.data.config,
        })),
        edges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          handle: edge.sourceHandle ?? '',
        })),
        triggerConfig,
      }),
    [nodes, edges, triggerConfig]
  );

  const lastGraphStructureKey = useRef(graphStructureKey);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        if (node.data.nodeType !== 'trigger') return node;
        return {
          ...node,
          data: {
            ...node.data,
            label: TRIGGER_LABELS[triggerType],
            config: { trigger_type: triggerType },
          },
        };
      })
    );
    invalidateValidation();
  }, [triggerType, setNodes, invalidateValidation]);

  useEffect(() => {
    if (lastGraphStructureKey.current === graphStructureKey) {
      return;
    }
    lastGraphStructureKey.current = graphStructureKey;
    invalidateValidation();
  }, [graphStructureKey, invalidateValidation]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const flowNodeTypes = useMemo(() => automationFlowNodeTypes, []);

  const triggerSelectOptions = useMemo(
    () => Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const stageSelectOptions = useMemo(() => [{ value: '', label: 'Any stage' }, ...LIFECYCLE_STAGE_SELECT_OPTIONS], []);

  const tagTriggerSelectOptions = useMemo(
    () => [
      { value: '', label: 'Any tag', searchText: 'any tag' },
      ...buildTagSelectOptions(tagSuggestions, triggerConfig.tag ?? ''),
    ],
    [tagSuggestions, triggerConfig.tag]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isGraphLocked) return;
      invalidateValidation();
      setEdges((eds) =>
        addEdge({ ...connection, id: `e-${connection.source}-${connection.target}-${Date.now()}` }, eds)
      );
    },
    [setEdges, isGraphLocked, invalidateValidation]
  );

  const handleNodesChange = useCallback(
    (...args: Parameters<typeof onNodesChange>) => {
      if (isGraphLocked) return;
      onNodesChange(...args);
    },
    [isGraphLocked, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (...args: Parameters<typeof onEdgesChange>) => {
      if (isGraphLocked) return;
      onEdgesChange(...args);
    },
    [isGraphLocked, onEdgesChange]
  );

  const addNode = (type: AutomationNodeType) => {
    if (isGraphLocked) return;
    invalidateValidation();
    const id = `${type}-${Date.now()}`;
    const y = 120 + nodes.length * 120;
    let config: Record<string, unknown> = {};
    let label = nodeLabel(type);
    if (type === 'wait') config = { duration_value: 24, duration_unit: 'hours' };
    if (type === 'condition_group') config = { logic: 'and', conditions: [] };
    if (type === 'send_email') {
      const first = emailActiveTemplates[0];
      config = { template_id: first?.id ?? '' };
      label = first?.name ?? 'Select template';
    }
    if (type === 'send_whatsapp') {
      const first = whatsappActiveTemplates[0];
      config = { template_id: first?.id ?? '' };
      label = first?.name ?? 'Select template';
    }
    if (type === 'trigger') {
      config = { trigger_type: triggerType };
      label = TRIGGER_LABELS[triggerType];
    }

    setNodes((current) => [
      ...current,
      {
        id,
        type,
        position: { x: 80, y },
        data: { nodeType: type, label, config },
      },
    ]);
  };

  const updateSelectedConfig = (config: Record<string, unknown>, label?: string) => {
    if (!selectedNodeId || isGraphLocked) return;
    invalidateValidation();
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
                label: label ?? node.data.label,
              },
            }
          : node
      )
    );
  };

  const removeSelectedNode = () => {
    if (!selectedNodeId || isGraphLocked) return;
    invalidateValidation();
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const buildPayloadGraph = useCallback(() => {
    const graph = flowToGraph(nodes, edges);
    return {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.type === 'trigger' ? { ...node, data: { trigger_type: triggerType } } : node
      ),
    };
  }, [nodes, edges, triggerType]);

  const buildTriggerConfig = useCallback((): Record<string, unknown> => {
    if (triggerType === 'stage_changed') {
      return {
        from_stage: triggerConfig.from_stage ?? '',
        to_stage: triggerConfig.to_stage ?? '',
      };
    }
    if (triggerType === 'tag_added') {
      return { tag: (triggerConfig.tag ?? '').trim() };
    }
    if (triggerType === 'renewal_payment_received') {
      return normalizeRenewalTriggerConfig(triggerConfig);
    }
    return {};
  }, [triggerConfig, triggerType]);

  const syncSavedAutomation = useCallback((saved: Automation) => {
    setStatus(saved.status);
    if (saved.triggerType === 'stage_changed') {
      setTriggerConfig(normalizeStageTriggerConfig(saved.triggerConfig));
    } else if (saved.triggerType === 'tag_added') {
      setTriggerConfig(normalizeTagTriggerConfig(saved.triggerConfig));
    } else if (saved.triggerType === 'renewal_payment_received') {
      setTriggerConfig(normalizeRenewalTriggerConfig(saved.triggerConfig));
    }
  }, []);

  const persist = (nextStatus?: Automation['status']) =>
    startTransition(async () => {
      setMessage(null);
      try {
        const graph = buildPayloadGraph();
        const saved = await saveAutomationAction(automation?.id ?? null, {
          name,
          description,
          channel: deriveAutomationChannel(graph),
          triggerType,
          triggerConfig: buildTriggerConfig(),
          graphJson: graph,
          status: nextStatus ?? status,
        });
        syncSavedAutomation(saved);
        setMessage('Draft saved.');
        invalidateValidation();
        if (!automation?.id) {
          router.replace(commsAutomationHref(saved.id));
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Save failed.');
      }
    });

  const runValidate = () =>
    startTransition(async () => {
      setMessage(null);
      try {
        const graph = buildPayloadGraph();
        const saved = await saveAutomationAction(automation?.id ?? null, {
          name,
          description,
          channel: deriveAutomationChannel(graph),
          triggerType,
          triggerConfig: buildTriggerConfig(),
          graphJson: graph,
          status: status === 'draft' ? 'draft' : 'paused',
        });
        syncSavedAutomation(saved);
        const result = await validateAutomationAction(saved.id);
        setValidationIssues(result.errors);
        setValidationPassed(result.valid);
        const focusIssue = result.errors.find((issue) => issue.node_id);
        const triggerNodeId = nodes.find((node) => node.data.nodeType === 'trigger')?.id;
        const focusNodeId = focusIssue?.node_id ?? (result.errors.length > 0 ? triggerNodeId : undefined);
        if (focusNodeId) {
          setSelectedNodeId(focusNodeId);
        }
        if (result.valid) {
          setMessage('Workflow is valid.');
        } else {
          setMessage(`Found ${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}.`);
        }
        if (!automation?.id) {
          router.replace(commsAutomationHref(saved.id));
        }
      } catch (error) {
        setValidationPassed(false);
        setMessage(error instanceof Error ? error.message : 'Validation failed.');
      }
    });

  const activate = () =>
    startTransition(async () => {
      if (!validationPassed) {
        setMessage('Validate the workflow before activating.');
        return;
      }
      setMessage(null);
      try {
        const graph = buildPayloadGraph();
        const saved = await saveAutomationAction(automation?.id ?? null, {
          name,
          description,
          channel: deriveAutomationChannel(graph),
          triggerType,
          triggerConfig: buildTriggerConfig(),
          graphJson: graph,
          status: status === 'draft' ? 'draft' : 'paused',
        });
        const activated = await activateAutomationAction(saved.id);
        setStatus(activated.status);
        setMessage('Workflow is active.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Activate failed.');
      }
    });

  const confirmDeactivate = () =>
    startTransition(async () => {
      if (!automation?.id || status !== 'active') return;
      setMessage(null);
      try {
        const updated = await deactivateAutomationAction(automation.id);
        setStatus(updated.status);
        setConfirmAction(null);
        setMessage('Workflow deactivated.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Deactivate failed.');
      }
    });

  const confirmArchive = () =>
    startTransition(async () => {
      if (!automation?.id || status !== 'paused') return;
      setMessage(null);
      try {
        const updated = await archiveAutomationAction(automation.id);
        setStatus(updated.status);
        setConfirmAction(null);
        setMessage('Workflow archived.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Archive failed.');
      }
    });

  const confirmDelete = () =>
    startTransition(async () => {
      if (!automation?.id || status !== 'draft') return;
      setMessage(null);
      try {
        await deleteAutomationAction(automation.id);
        setConfirmAction(null);
        router.push(COMMS_AUTOMATIONS_HREF);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Delete failed.');
      }
    });

  const handleConfirmAction = () => {
    if (confirmAction === 'archive') confirmArchive();
    else if (confirmAction === 'delete') confirmDelete();
    else if (confirmAction === 'deactivate') confirmDeactivate();
  };

  return (
    <div className="flex flex-col gap-4">
      {confirmAction ? (
        <AutomationConfirmDialog
          action={confirmAction}
          open
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
          automationName={name}
          pending={isPending}
          onConfirm={handleConfirmAction}
        />
      ) : null}
      <Card padding="sm" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
        <div className="min-w-0 space-y-2">
          <TextInput
            value={name}
            onChange={setName}
            disabled={isArchived}
            placeholder="Workflow name"
            className="bg-white"
            aria-label="Workflow name"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            disabled={isArchived}
            rows={2}
            className="resize-none rounded-2xl border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
          />
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-[480px]">
          <Pill tone={automationStatusPillTone(status)}>{automationStatusLabel(status)}</Pill>
          {!isArchived ? (
            <Button
              variant="light"
              size="sm"
              disabled={isPending}
              onClick={() => persist()}
              className="min-w-[140px] justify-center"
            >
              {status === 'draft' ? 'Save draft' : 'Save changes'}
            </Button>
          ) : null}
          {!isArchived && status !== 'active' ? (
            <>
              <Button
                variant="success"
                size="sm"
                disabled={isPending || !validationPassed}
                onClick={activate}
                className="min-w-[140px] justify-center"
              >
                Turn on
              </Button>
              {automation?.id && status === 'draft' ? (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmAction('delete')}
                  className="min-w-[140px] justify-center"
                >
                  Delete draft
                </Button>
              ) : null}
              {status === 'paused' ? (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmAction('archive')}
                  className="min-w-[140px] justify-center"
                >
                  Archive
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                  onClick={runValidate}
                  className="min-w-[140px] justify-center"
                >
                  Check workflow
                </Button>
              )}
              {status === 'paused' ? (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                  onClick={runValidate}
                  className="min-w-[140px] justify-center"
                >
                  Check workflow
                </Button>
              ) : null}
            </>
          ) : null}
          {!isArchived && status === 'active' ? (
            <Button
              variant="amber"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmAction('deactivate')}
              className="min-w-[140px] justify-center"
            >
              Turn off
            </Button>
          ) : null}
        </div>
      </Card>

      {isArchived ? (
        <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          This workflow is archived and read-only. It is hidden from the automations list; enrollment history below is
          preserved.
        </p>
      ) : status === 'active' ? (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This workflow is on. Triggers and steps are read-only — turn it off to edit the graph. Name and description
          can still be updated.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-canvas-cool">
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-white px-3 py-2">
            <Field label="When this happens" className="min-w-[180px]">
              <AutomationBuilderSelect
                value={triggerType}
                onChange={(next) => {
                  const value = next as AutomationTriggerType;
                  setTriggerType(value);
                  if (value === 'stage_changed') {
                    setTriggerConfig((current) => {
                      if ('from_stage' in current || 'to_stage' in current) {
                        return current;
                      }
                      return normalizeStageTriggerConfig(undefined, { applyDefaults: true });
                    });
                  }
                  if (value === 'renewal_payment_received') {
                    setTriggerConfig((current) => {
                      if ('renewal_category' in current) {
                        return current;
                      }
                      return normalizeRenewalTriggerConfig(undefined);
                    });
                  }
                }}
                options={triggerSelectOptions}
                disabled={isGraphLocked}
              />
            </Field>
            {triggerType === 'stage_changed' ? (
              <>
                <Field label="From stage" className="min-w-[160px]">
                  <AutomationBuilderSelect
                    value={triggerConfig.from_stage ?? ''}
                    onChange={(value) => setTriggerConfig((current) => ({ ...current, from_stage: value }))}
                    options={stageSelectOptions}
                    disabled={isGraphLocked}
                  />
                </Field>
                <Field label="To stage" className="min-w-[160px]">
                  <AutomationBuilderSelect
                    value={triggerConfig.to_stage ?? ''}
                    onChange={(value) => setTriggerConfig((current) => ({ ...current, to_stage: value }))}
                    options={stageSelectOptions}
                    disabled={isGraphLocked}
                  />
                </Field>
              </>
            ) : null}
            {triggerType === 'renewal_payment_received' ? (
              <Field label="Renew category" className="min-w-[220px]">
                <AutomationBuilderSelect
                  value={triggerConfig.renewal_category ?? ''}
                  onChange={(value) => setTriggerConfig((current) => ({ ...current, renewal_category: value }))}
                  options={[{ value: '', label: 'Any renew category' }, ...RENEW_CATEGORY_SELECT_OPTIONS]}
                  disabled={isGraphLocked}
                />
              </Field>
            ) : null}
            {triggerType === 'tag_added' ? (
              <Field label="Tag added" className="min-w-[200px]">
                <SearchableSelect
                  value={triggerConfig.tag ?? ''}
                  onChange={(slug) => setTriggerConfig((current) => ({ ...current, tag: slug }))}
                  options={tagTriggerSelectOptions}
                  placeholder="Any tag"
                  searchPlaceholder="Search tags…"
                  emptyMessage="No tags found."
                  disabled={isGraphLocked}
                  className="w-full text-sm"
                  popoverClassName="w-[var(--anchor-width)]"
                />
              </Field>
            ) : null}
            <div className="flex flex-wrap gap-2 pb-0.5">
              <Button variant="light" size="sm" disabled={isGraphLocked} onClick={() => addNode('wait')}>
                + Wait
              </Button>
              <Button variant="light" size="sm" disabled={isGraphLocked} onClick={() => addNode('condition_group')}>
                + Rules
              </Button>
              <Button variant="light" size="sm" disabled={isGraphLocked} onClick={() => addNode('send_email')}>
                + Send email
              </Button>
              <Button
                variant="light"
                size="sm"
                disabled={isGraphLocked}
                leftIcon={<WhatsAppIcon />}
                onClick={() => addNode('send_whatsapp')}
              >
                + Send WhatsApp
              </Button>
              <Button variant="light" size="sm" disabled={isGraphLocked} onClick={() => addNode('end')}>
                + End
              </Button>
            </div>
          </div>
          <div className="h-[560px]">
            <AutomationValidationErrorsContext.Provider value={validationErrorByNode}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                nodeTypes={flowNodeTypes}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                nodesDraggable={!isGraphLocked}
                nodesConnectable={!isGraphLocked}
                edgesReconnectable={!isGraphLocked}
                deleteKeyCode={isGraphLocked ? null : undefined}
                elementsSelectable
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={16} size={1} color="#E2E8F0" />
                <Controls />
              </ReactFlow>
            </AutomationValidationErrorsContext.Provider>
          </div>
        </div>

        <Card padding="sm" className="flex flex-col gap-3">
          <SectionHead
            title={`Step settings${isGraphLocked ? ' (read-only)' : ''}`}
            subtitle="Select a step on the canvas to edit it."
          />
          {!selectedNode ? (
            <p className="text-sm text-slate-500">No step selected.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{nodeLabel(selectedNode.data.nodeType)}</p>
                {selectedNode.data.nodeType !== 'trigger' && !isGraphLocked ? (
                  <Button variant="ghost" size="sm" onClick={removeSelectedNode} aria-label="Remove step">
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                ) : null}
              </div>
              <NodeConfigPanel
                node={selectedNode}
                emailTemplates={emailActiveTemplates}
                whatsappTemplatesForSelect={whatsappTemplatesForSelect}
                tagSuggestions={tagSuggestions}
                readOnly={isGraphLocked}
                onChange={updateSelectedConfig}
              />
            </>
          )}

          <div className="mt-2 border-t border-slate-100 pt-4">
            <SectionHead title="Workflow check" />
            {validationIssues.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-rose-600">
                {validationIssues.map((issue, index) => {
                  const node = nodes.find((n) => n.id === issue.node_id);
                  const label = validationIssueDisplay(issue, node?.data.nodeType);
                  const focusId = issue.node_id || nodes.find((n) => n.data.nodeType === 'trigger')?.id;
                  return (
                    <li key={`${issue.node_id}-${index}`}>
                      {focusId ? (
                        <button
                          type="button"
                          onClick={() => setSelectedNodeId(focusId)}
                          className="text-left hover:underline"
                        >
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : validationPassed ? (
              <p className="text-xs font-medium text-emerald-600">Ready to turn on.</p>
            ) : (
              <p className="text-xs text-slate-500">
                Run Check workflow before turning on. Edits clear the last result.
              </p>
            )}
          </div>
        </Card>
      </div>

      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
    </div>
  );
}

function NodeConfigPanel({
  node,
  emailTemplates,
  whatsappTemplatesForSelect,
  tagSuggestions,
  readOnly = false,
  onChange,
}: {
  node: Node<BuilderNodeData>;
  emailTemplates: BuilderTemplate[];
  whatsappTemplatesForSelect: WhatsAppTemplate[];
  tagSuggestions: TagSuggestion[];
  readOnly?: boolean;
  onChange: (config: Record<string, unknown>, label?: string) => void;
}) {
  const conditionFieldOptions = useMemo(
    () => AUTOMATION_CONDITION_FIELDS.map((field) => ({ value: field.value, label: field.label })),
    []
  );

  const templateOptions = useMemo(
    () => emailTemplates.map((template) => ({ value: template.id, label: template.name })),
    [emailTemplates]
  );

  useEffect(() => {
    if (readOnly || node.data.nodeType !== 'condition_group') return;
    const group = node.data.config as AutomationConditionGroupData;
    const normalized = group.conditions.map(normalizeTagCondition);
    const changed = normalized.some((condition, index) => condition.operator !== group.conditions[index].operator);
    if (changed) {
      onChange({ ...group, conditions: normalized });
    }
  }, [readOnly, node.data.nodeType, node.id, node.data.config, onChange]);

  const panel = (() => {
    if (node.data.nodeType === 'wait') {
      const wait = node.data.config as AutomationWaitData;
      return (
        <Field label="Wait for">
          <div className="flex gap-2">
            <TextInput
              type="number"
              min={1}
              value={String(wait.duration_value)}
              disabled={readOnly}
              onChange={(value) => onChange({ ...wait, duration_value: Number(value) || 1 })}
              className="w-24"
            />
            <AutomationBuilderSelect
              value={wait.duration_unit}
              onChange={(value) => onChange({ ...wait, duration_unit: value })}
              options={WAIT_UNIT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              disabled={readOnly}
              className="flex-1"
            />
          </div>
        </Field>
      );
    }

    if (node.data.nodeType === 'send_email' || node.data.nodeType === 'send_whatsapp') {
      const send = node.data.config as AutomationSendEmailData | AutomationSendWhatsAppData;
      if (node.data.nodeType === 'send_whatsapp') {
        return (
          <Field label="WhatsApp template">
            <WhatsAppTemplateSelect
              templates={whatsappTemplatesForSelect}
              value={send.template_id}
              onChange={(value) => {
                const template = whatsappTemplatesForSelect.find((item) => item.id === value);
                onChange({ template_id: value }, template?.name ?? 'Select template');
              }}
              disabled={readOnly}
              popoverClassName="w-[var(--anchor-width)]"
            />
          </Field>
        );
      }
      return (
        <Field label="Email template">
          <AutomationBuilderSelect
            value={send.template_id}
            onChange={(value) => {
              const template = emailTemplates.find((item) => item.id === value);
              onChange({ template_id: value }, template?.name ?? 'Select template');
            }}
            options={templateOptions}
            placeholder="Select template"
            disabled={readOnly}
          />
        </Field>
      );
    }

    if (node.data.nodeType === 'condition_group') {
      const group = node.data.config as AutomationConditionGroupData;
      const updateCondition = (index: number, patch: Partial<AutomationCondition>) => {
        const conditions = group.conditions.map((c, i) => normalizeTagCondition(i === index ? { ...c, ...patch } : c));
        onChange({ ...group, conditions });
      };
      const addCondition = () => {
        onChange({
          ...group,
          conditions: [...group.conditions, { field: 'lifecycle_stage', operator: 'equals', value: 'inquiry' }],
        });
      };
      const removeCondition = (index: number) => {
        onChange({ ...group, conditions: group.conditions.filter((_, i) => i !== index) });
      };

      return (
        <div className="flex flex-col gap-3">
          <Field label="Match when">
            <AutomationBuilderSelect
              value={group.logic}
              onChange={(value) => onChange({ ...group, logic: value as 'and' | 'or' })}
              options={CONDITION_LOGIC_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              disabled={readOnly}
            />
          </Field>
          {group.conditions.map((condition, index) => {
            const isTagField = condition.field === 'tag';
            const isLockedIsField = LOCKED_IS_FIELDS.has(condition.field);
            const operatorValue = isLockedIsField
              ? 'equals'
              : isTagField
                ? tagConditionOperator(condition.operator)
                : defaultConditionOperator(condition.operator);
            const tagValue = String(condition.value ?? '');
            const tagOptions = isTagField ? buildTagSelectOptions(tagSuggestions, tagValue) : [];
            const operatorOptions = (
              isLockedIsField
                ? [{ value: 'equals', label: 'is' }]
                : isTagField
                  ? TAG_CONDITION_OPERATORS
                  : DEFAULT_CONDITION_OPERATORS
            ).map((operator) => ({ value: operator.value, label: operator.label }));

            return (
              <div key={index} className="rounded-xl border border-slate-100 bg-canvas-cool p-3">
                <div className="flex flex-col gap-2">
                  <AutomationBuilderSelect
                    value={condition.field}
                    onChange={(field) => {
                      updateCondition(index, defaultConditionForField(field));
                    }}
                    options={conditionFieldOptions}
                    disabled={readOnly}
                  />
                  <AutomationBuilderSelect
                    value={operatorValue}
                    onChange={(operator) => updateCondition(index, { operator })}
                    options={operatorOptions}
                    disabled={readOnly || isLockedIsField}
                  />
                  {condition.field === 'lifecycle_stage' ? (
                    <AutomationBuilderSelect
                      value={String(condition.value)}
                      onChange={(value) => updateCondition(index, { value })}
                      options={LIFECYCLE_STAGE_SELECT_OPTIONS}
                      disabled={readOnly}
                    />
                  ) : condition.field === 'has_enrollment' ||
                    condition.field === 'has_checkout' ||
                    condition.field === 'has_payment' ? (
                    <AutomationBuilderSelect
                      value={String(condition.value)}
                      onChange={(value) => updateCondition(index, { value: value === 'true' })}
                      options={BOOLEAN_CONDITION_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      disabled={readOnly}
                    />
                  ) : isTagField ? (
                    <SearchableSelect
                      value={tagValue}
                      onChange={(slug) => updateCondition(index, { value: slug })}
                      options={tagOptions}
                      placeholder="Select tag…"
                      searchPlaceholder="Search tags…"
                      emptyMessage="No tags found."
                      disabled={readOnly}
                      className="w-full text-xs"
                      popoverClassName="w-[var(--anchor-width)]"
                    />
                  ) : condition.field === 'manual_source' ? (
                    <SearchableSelect
                      value={String(condition.value ?? '')}
                      onChange={(source) => updateCondition(index, { value: source })}
                      options={buildLeadSourceSelectOptions(String(condition.value ?? ''))}
                      placeholder="Select lead source…"
                      searchPlaceholder="Search lead sources…"
                      emptyMessage="No sources found."
                      disabled={readOnly}
                      className="w-full text-xs"
                      popoverClassName="w-[var(--anchor-width)]"
                    />
                  ) : (
                    <TextInput
                      value={String(condition.value ?? '')}
                      disabled={readOnly}
                      onChange={(value) => updateCondition(index, { value })}
                    />
                  )}
                </div>
                {!readOnly ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="mt-2 text-rose-500"
                  >
                    Remove rule
                  </Button>
                ) : null}
              </div>
            );
          })}
          {!readOnly ? (
            <Button variant="light" size="sm" onClick={addCondition}>
              + Add rule
            </Button>
          ) : null}
        </div>
      );
    }

    return <p className="text-sm text-slate-500">This step has no editable settings.</p>;
  })();

  return <div className={readOnly ? 'opacity-80' : undefined}>{panel}</div>;
}
