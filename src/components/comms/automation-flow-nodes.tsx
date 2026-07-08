'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Clock, GitBranch, Mail, Play, Square } from 'lucide-react';
import type { AutomationConditionGroupData, AutomationNodeType, AutomationWaitData } from '@/lib/automation-types';
import { useAutomationNodeValidation } from '@/components/comms/automation-validation-context';

export type BuilderNodeData = {
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
        Rules
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

function EndNode({ id, selected }: NodeProps<Node<BuilderNodeData>>) {
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

export const automationFlowNodeTypes = {
  trigger: TriggerNode,
  wait: WaitNode,
  condition_group: ConditionNode,
  send_email: SendEmailNode,
  end: EndNode,
};
