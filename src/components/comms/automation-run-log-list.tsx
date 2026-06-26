'use client';

import { automationRunOutcomeLabel, formatAutomationRunDetails, nodeLabel } from '@/lib/automation-types';
import type { AutomationNodeType, AutomationRunLogEntry } from '@/lib/automation-types';

type AutomationRunLogListProps = {
  entries: AutomationRunLogEntry[];
  emptyMessage?: string;
};

export function AutomationRunLogList({ entries, emptyMessage = 'No steps logged yet.' }: AutomationRunLogListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, index) => {
        const detail = formatAutomationRunDetails(entry.details);
        const stepLabel = nodeLabel(entry.nodeType as AutomationNodeType);
        return (
          <li key={entry.id} className="rounded-xl border border-slate-100 bg-canvas-cool px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {index + 1}. {stepLabel} · {automationRunOutcomeLabel(entry.outcome)}
                </p>
                {detail ? <p className="mt-0.5 text-xs text-slate-600">{detail}</p> : null}
              </div>
              <time className="shrink-0 text-[10px] font-medium text-slate-400">
                {new Date(entry.createdAt).toLocaleTimeString()}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
