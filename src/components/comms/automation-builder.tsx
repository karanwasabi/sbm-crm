'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Clock, GitBranch, Mail, Play, Square, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailTemplate, Automation } from '@/utils/api';
import type {
  AutomationCondition,
  AutomationConditionGroupData,
  AutomationGraph,
  AutomationNodeType,
  AutomationRunLogEntry,
  AutomationSendEmailData,
  AutomationTriggerType,
  AutomationWaitData,
} from '@/lib/automation-types';
import {
  AUTOMATION_CONDITION_FIELDS,
  LIFECYCLE_STAGE_OPTIONS,
  TRIGGER_LABELS,
  defaultAutomationGraph,
  defaultStageTriggerConfig,
  nodeLabel,
  validationIssueDisplay,
} from '@/lib/automation-types';
import {
  activateAutomationAction,
  deactivateAutomationAction,
  deleteAutomationAction,
  getAutomationEnrollmentLogAction,
  saveAutomationAction,
  testAutomationAction,
  validateAutomationAction,
} from '@/app/(crm)/communications/actions';
import { AutomationRunLogList } from '@/components/comms/automation-run-log-list';
import type { AutomationValidationIssue } from '@/utils/api';
import {
  AutomationValidationErrorsContext,
  useAutomationNodeValidation,
} from '@/components/comms/automation-validation-context';
import { Pill } from '@/components/ui/pill';
import { automationStatusLabel, automationStatusPillTone } from '@/lib/automation-types';

type BuilderNodeData = {
  nodeType: AutomationNodeType;
  label: string;
  config: Record<string, unknown>;
};

function nodeShellClass(selected: boolean, hasError?: boolean) {
  if (hasError) {
    return 'border-rose-500 bg-rose-50 ring-2 ring-rose-300';
  }
  if (selected) {
    return 'border-brand ring-2 ring-brand/20';
  }
  return 'border-slate-200';
}

function TriggerNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const errorMessage = useAutomationNodeValidation(id);
  const hasError = Boolean(errorMessage);
  return (
    <div
      className={`min-w-[180px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${nodeShellClass(!!selected, hasError)}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-brand uppercase">
        <Play className="h-3.5 w-3.5" />
        Trigger
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">{data.label}</p>
      {errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p> : null}
      <Handle type="source" position={Position.Bottom} className="!bg-brand" />
    </div>
  );
}

function WaitNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const wait = data.config as AutomationWaitData;
  const errorMessage = useAutomationNodeValidation(id);
  const hasError = Boolean(errorMessage);
  return (
    <div
      className={`min-w-[180px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${nodeShellClass(!!selected, hasError)}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-700 uppercase">
        <Clock className="h-3.5 w-3.5" />
        Wait
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {wait.duration_value} {wait.duration_unit}
      </p>
      {errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p> : null}
      <Handle type="source" position={Position.Bottom} className="!bg-brand" />
    </div>
  );
}

function ConditionNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const group = data.config as AutomationConditionGroupData;
  const errorMessage = useAutomationNodeValidation(id);
  const hasError = Boolean(errorMessage);
  return (
    <div
      className={`min-w-[200px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${nodeShellClass(!!selected, hasError)}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-violet-700 uppercase">
        <GitBranch className="h-3.5 w-3.5" />
        Conditions
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {group.conditions.length} rule{group.conditions.length === 1 ? '' : 's'} ({group.logic.toUpperCase()})
      </p>
      {errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p> : null}
      <div className="mt-3 flex justify-between text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        <span>No</span>
        <span>Yes</span>
      </div>
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: '25%' }} className="!bg-rose-400" />
      <Handle id="true" type="source" position={Position.Bottom} style={{ left: '75%' }} className="!bg-emerald-500" />
    </div>
  );
}

function SendEmailNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const errorMessage = useAutomationNodeValidation(id);
  const hasError = Boolean(errorMessage);
  return (
    <div
      className={`min-w-[180px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${nodeShellClass(!!selected, hasError)}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-sky-700 uppercase">
        <Mail className="h-3.5 w-3.5" />
        Send email
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{data.label}</p>
      {errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p> : null}
      <Handle type="source" position={Position.Bottom} className="!bg-brand" />
    </div>
  );
}

function EndNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const errorMessage = useAutomationNodeValidation(id);
  const hasError = Boolean(errorMessage);
  return (
    <div
      className={`min-w-[120px] rounded-2xl border px-4 py-3 shadow-sm ${hasError ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300' : 'border-slate-200 bg-slate-50'} ${selected && !hasError ? 'border-brand ring-2 ring-brand/20' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
        <Square className="h-3.5 w-3.5" />
        End
      </div>
      {errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  wait: WaitNode,
  condition_group: ConditionNode,
  send_email: SendEmailNode,
  end: EndNode,
};

function graphToFlow(
  graph: AutomationGraph,
  templates: EmailTemplate[]
): { nodes: Node<BuilderNodeData>[]; edges: Edge[] } {
  const templateById = new Map(templates.map((t) => [t.id, t.name]));
  const nodes: Node<BuilderNodeData>[] = graph.nodes.map((node) => {
    let label = nodeLabel(node.type);
    if (node.type === 'trigger') {
      label = TRIGGER_LABELS[(node.data as { trigger_type: AutomationTriggerType }).trigger_type] ?? 'Trigger';
    }
    if (node.type === 'send_email') {
      const templateId = (node.data as AutomationSendEmailData).template_id;
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
  templates: EmailTemplate[];
  onTestComplete?: () => void;
};

export function AutomationBuilder({ automation, templates, onTestComplete }: AutomationBuilderProps) {
  const router = useRouter();
  const initialGraph = automation?.graphJson ?? defaultAutomationGraph(automation?.triggerType ?? 'lead_created');
  const initialFlow = useMemo(() => graphToFlow(initialGraph, templates), [initialGraph, templates]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(automation?.name ?? 'New nurture workflow');
  const [description, setDescription] = useState(automation?.description ?? '');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(automation?.triggerType ?? 'lead_created');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>(() => {
    const raw = automation?.triggerConfig ?? {};
    if (automation?.triggerType === 'stage_changed' || !automation) {
      return {
        ...defaultStageTriggerConfig(),
        ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)])),
      };
    }
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)]));
  });
  const [status, setStatus] = useState(automation?.status ?? 'draft');
  const [testLeadId, setTestLeadId] = useState('');
  const [testRunLog, setTestRunLog] = useState<AutomationRunLogEntry[]>([]);
  const [testEnrollmentId, setTestEnrollmentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<AutomationValidationIssue[]>([]);
  const [validationPassed, setValidationPassed] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const onConnect = useCallback(
    (connection: Connection) => {
      if (status === 'active') return;
      invalidateValidation();
      setEdges((eds) =>
        addEdge({ ...connection, id: `e-${connection.source}-${connection.target}-${Date.now()}` }, eds)
      );
    },
    [setEdges, status, invalidateValidation]
  );

  const addNode = (type: AutomationNodeType) => {
    if (status === 'active') return;
    invalidateValidation();
    const id = `${type}-${Date.now()}`;
    const y = 120 + nodes.length * 120;
    let config: Record<string, unknown> = {};
    let label = nodeLabel(type);
    if (type === 'wait') config = { duration_value: 24, duration_unit: 'hours' };
    if (type === 'condition_group') config = { logic: 'and', conditions: [] };
    if (type === 'send_email') {
      config = { template_id: templates[0]?.id ?? '' };
      label = templates[0]?.name ?? 'Select template';
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
    if (!selectedNodeId) return;
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
    if (!selectedNodeId) return;
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
    if (triggerType !== 'stage_changed') {
      return {};
    }
    const config: Record<string, string> = {};
    if (triggerConfig.from_stage) config.from_stage = triggerConfig.from_stage;
    if (triggerConfig.to_stage) config.to_stage = triggerConfig.to_stage;
    return config;
  }, [triggerConfig, triggerType]);

  const persist = (nextStatus?: Automation['status']) =>
    startTransition(async () => {
      setMessage(null);
      try {
        const graph = buildPayloadGraph();
        const saved = await saveAutomationAction(automation?.id ?? null, {
          name,
          description,
          triggerType,
          triggerConfig: buildTriggerConfig(),
          graphJson: graph,
          status: nextStatus ?? status,
        });
        setStatus(saved.status);
        setMessage('Draft saved.');
        invalidateValidation();
        if (!automation?.id && typeof window !== 'undefined') {
          window.location.href = `/communications/automations/${saved.id}`;
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
          triggerType,
          triggerConfig: buildTriggerConfig(),
          graphJson: graph,
          status: status === 'draft' ? 'draft' : 'paused',
        });
        setStatus(saved.status);
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
        if (!automation?.id && typeof window !== 'undefined') {
          window.location.href = `/communications/automations/${saved.id}`;
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

  const deactivate = () =>
    startTransition(async () => {
      if (!automation?.id || status !== 'active') return;
      if (!window.confirm(`Deactivate "${name}"? New leads will not enroll until you activate again.`)) return;
      setMessage(null);
      try {
        const updated = await deactivateAutomationAction(automation.id);
        setStatus(updated.status);
        setMessage('Workflow deactivated.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Deactivate failed.');
      }
    });

  const runTest = () =>
    startTransition(async () => {
      if (!automation?.id || !testLeadId.trim()) {
        setMessage('Save the workflow and enter a lead ID to test.');
        return;
      }
      setMessage(null);
      setTestRunLog([]);
      setTestEnrollmentId(null);
      try {
        const result = await testAutomationAction(automation.id, testLeadId.trim());
        const log = await getAutomationEnrollmentLogAction(result.enrollmentId);
        setTestEnrollmentId(result.enrollmentId);
        setTestRunLog(log);
        setMessage('Test run completed — no emails were sent.');
        onTestComplete?.();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Test failed.');
      }
    });

  const removeDraft = () =>
    startTransition(async () => {
      if (!automation?.id || status !== 'draft') return;
      if (!window.confirm(`Delete draft "${name}"? This cannot be undone.`)) return;
      setMessage(null);
      try {
        await deleteAutomationAction(automation.id);
        router.push('/communications');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Delete failed.');
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-lg font-extrabold text-slate-800 outline-none"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="mt-1 w-full bg-transparent text-sm text-slate-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={automationStatusPillTone(status)}>{automationStatusLabel(status)}</Pill>
          <button
            type="button"
            disabled={isPending}
            onClick={() => persist()}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            {status === 'draft' ? 'Save draft' : 'Save changes'}
          </button>
          {status !== 'active' ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={runValidate}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Validate
              </button>
              <button
                type="button"
                disabled={isPending || !validationPassed}
                onClick={activate}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Activate
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={deactivate}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"
            >
              Deactivate
            </button>
          )}
          {automation?.id && status === 'draft' ? (
            <button
              type="button"
              disabled={isPending}
              onClick={removeDraft}
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600"
            >
              Delete draft
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-canvas-cool">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-white px-3 py-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              Trigger
              <select
                value={triggerType}
                onChange={(e) => {
                  const next = e.target.value as AutomationTriggerType;
                  setTriggerType(next);
                  if (next === 'stage_changed') {
                    setTriggerConfig((current) => ({
                      ...defaultStageTriggerConfig(),
                      ...current,
                    }));
                  }
                }}
                disabled={status === 'active'}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-60"
              >
                {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {triggerType === 'stage_changed' ? (
              <>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  From
                  <select
                    value={triggerConfig.from_stage ?? ''}
                    onChange={(e) => setTriggerConfig((current) => ({ ...current, from_stage: e.target.value }))}
                    disabled={status === 'active'}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-60"
                  >
                    <option value="">Any stage</option>
                    {LIFECYCLE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  To
                  <select
                    value={triggerConfig.to_stage ?? ''}
                    onChange={(e) => setTriggerConfig((current) => ({ ...current, to_stage: e.target.value }))}
                    disabled={status === 'active'}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-60"
                  >
                    <option value="">Any stage</option>
                    {LIFECYCLE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => addNode('wait')}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
            >
              + Wait
            </button>
            <button
              type="button"
              onClick={() => addNode('condition_group')}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
            >
              + Conditions
            </button>
            <button
              type="button"
              onClick={() => addNode('send_email')}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
            >
              + Send email
            </button>
            <button
              type="button"
              onClick={() => addNode('end')}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
            >
              + End
            </button>
          </div>
          <div className="h-[560px]">
            <AutomationValidationErrorsContext.Provider value={validationErrorByNode}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                fitView
              >
                <Background gap={16} size={1} color="#E2E8F0" />
                <MiniMap pannable zoomable />
                <Controls />
              </ReactFlow>
            </AutomationValidationErrorsContext.Provider>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Node settings</p>
          {!selectedNode ? (
            <p className="text-sm text-slate-500">Select a node on the canvas to edit its settings.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{nodeLabel(selectedNode.data.nodeType)}</p>
                {selectedNode.data.nodeType !== 'trigger' ? (
                  <button type="button" onClick={removeSelectedNode} className="text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <NodeConfigPanel node={selectedNode} templates={templates} onChange={updateSelectedConfig} />
            </>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Validation</p>
            {validationIssues.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-xs text-rose-600">
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
              <p className="mt-1 text-xs font-medium text-emerald-600">Ready to activate.</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Run Validate before activating. Edits clear the last result.
              </p>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Test mode</p>
            <p className="mt-1 text-xs text-slate-500">Dry-run against a lead — logs steps without sending email.</p>
            <input
              value={testLeadId}
              onChange={(e) => setTestLeadId(e.target.value)}
              placeholder="Lead UUID"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isPending || !automation?.id}
              onClick={runTest}
              className="mt-2 w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50"
            >
              Run test
            </button>
            {testEnrollmentId ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Test results</p>
                <AutomationRunLogList entries={testRunLog} emptyMessage="No steps logged for this test run." />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
    </div>
  );
}

function NodeConfigPanel({
  node,
  templates,
  onChange,
}: {
  node: Node<BuilderNodeData>;
  templates: EmailTemplate[];
  onChange: (config: Record<string, unknown>, label?: string) => void;
}) {
  if (node.data.nodeType === 'wait') {
    const wait = node.data.config as AutomationWaitData;
    return (
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-600">
          Duration
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={1}
              value={wait.duration_value}
              onChange={(e) => onChange({ ...wait, duration_value: Number(e.target.value) || 1 })}
              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
            />
            <select
              value={wait.duration_unit}
              onChange={(e) => onChange({ ...wait, duration_unit: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </label>
      </div>
    );
  }

  if (node.data.nodeType === 'send_email') {
    const send = node.data.config as AutomationSendEmailData;
    return (
      <label className="text-xs font-semibold text-slate-600">
        Template
        <select
          value={send.template_id}
          onChange={(e) => {
            const template = templates.find((t) => t.id === e.target.value);
            onChange({ template_id: e.target.value }, template?.name ?? 'Select template');
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">Select template</option>
          {templates
            .filter((t) => t.status === 'active')
            .map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
        </select>
      </label>
    );
  }

  if (node.data.nodeType === 'condition_group') {
    const group = node.data.config as AutomationConditionGroupData;
    const updateCondition = (index: number, patch: Partial<AutomationCondition>) => {
      const conditions = group.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c));
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
        <label className="text-xs font-semibold text-slate-600">
          Match
          <select
            value={group.logic}
            onChange={(e) => onChange({ ...group, logic: e.target.value as 'and' | 'or' })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="and">All conditions (AND)</option>
            <option value="or">Any condition (OR)</option>
          </select>
        </label>
        {group.conditions.map((condition, index) => (
          <div key={index} className="rounded-xl border border-slate-100 bg-canvas-cool p-2">
            <select
              value={condition.field}
              onChange={(e) => updateCondition(index, { field: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {AUTOMATION_CONDITION_FIELDS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, { operator: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Not equals</option>
              <option value="contains">Contains</option>
              <option value="greater_than">Greater than</option>
              <option value="less_than">Less than</option>
              <option value="is_empty">Is empty</option>
              <option value="is_not_empty">Is not empty</option>
            </select>
            {condition.field === 'lifecycle_stage' ? (
              <select
                value={String(condition.value)}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                {LIFECYCLE_STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            ) : condition.field === 'consent_status' ||
              condition.field === 'has_enrollment' ||
              condition.field === 'has_checkout' ||
              condition.field === 'has_payment' ? (
              <select
                value={String(condition.value)}
                onChange={(e) => updateCondition(index, { value: e.target.value === 'true' })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                value={String(condition.value ?? '')}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            )}
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="mt-2 text-xs font-bold text-rose-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCondition}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600"
        >
          + Add condition
        </button>
      </div>
    );
  }

  return <p className="text-sm text-slate-500">This node has no editable settings.</p>;
}
