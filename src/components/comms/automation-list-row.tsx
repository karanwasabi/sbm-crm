'use client';

import { Trash2, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteAutomationAction } from '@/app/(crm)/communications/actions';
import { Pill } from '@/components/ui/pill';
import { TRIGGER_LABELS, automationStatusLabel, automationStatusPillTone } from '@/lib/automation-types';
import type { Automation } from '@/utils/api';

type AutomationListRowProps = {
  automation: Automation;
};

export function AutomationListRow({ automation }: AutomationListRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isDraft = automation.status === 'draft';

  const onDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraft) return;
    if (!window.confirm(`Delete draft "${automation.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteAutomationAction(automation.id);
      router.refresh();
    });
  };

  return (
    <Link
      href={`/communications/automations/${automation.id}`}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 transition hover:border-brand/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Workflow className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">{automation.name}</p>
          <p className="truncate text-xs font-medium text-slate-500">
            {TRIGGER_LABELS[automation.triggerType]} · v{automation.graphVersion}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isDraft ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onDelete}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            aria-label={`Delete ${automation.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
        <Pill tone={automationStatusPillTone(automation.status)}>{automationStatusLabel(automation.status)}</Pill>
      </div>
    </Link>
  );
}
