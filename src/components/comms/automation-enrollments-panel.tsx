'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState, useTransition } from 'react';
import { getAutomationEnrollmentLogAction, listAutomationEnrollmentsAction } from '@/app/(crm)/communications/actions';
import { AutomationRunLogList } from '@/components/comms/automation-run-log-list';
import { Pill } from '@/components/ui/pill';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { automationEnrollmentStatusLabel } from '@/lib/automation-types';
import type { AutomationEnrollment, AutomationRunLogEntry } from '@/lib/automation-types';

type AutomationEnrollmentsPanelProps = {
  automationId: string;
  refreshToken?: number;
  activeTab?: EnrollmentTab;
  onTabChange?: (tab: EnrollmentTab) => void;
};

type EnrollmentTab = 'production' | 'test';

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function enrollmentStatusTone(status: string): 'success' | 'warn' | 'neutral' | 'brand' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'waiting':
      return 'warn';
    case 'failed':
      return 'neutral';
    default:
      return 'brand';
  }
}

export function AutomationEnrollmentsPanel({
  automationId,
  refreshToken = 0,
  activeTab,
  onTabChange,
}: AutomationEnrollmentsPanelProps) {
  const [tab, setTab] = useState<EnrollmentTab>(activeTab ?? 'production');
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logsByEnrollment, setLogsByEnrollment] = useState<Record<string, AutomationRunLogEntry[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  const selectTab = (next: EnrollmentTab) => {
    setTab(next);
    onTabChange?.(next);
  };

  const loadEnrollments = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const rows = await listAutomationEnrollmentsAction(automationId, tab === 'test');
        setEnrollments(rows);
        setExpandedId(null);
        setLogsByEnrollment({});
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load enrollments.');
      }
    });
  }, [automationId, tab]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments, refreshToken]);

  const toggleLog = (enrollmentId: string) => {
    if (expandedId === enrollmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(enrollmentId);
    if (logsByEnrollment[enrollmentId]) {
      return;
    }
    startTransition(async () => {
      try {
        const log = await getAutomationEnrollmentLogAction(enrollmentId);
        setLogsByEnrollment((current) => ({ ...current, [enrollmentId]: log }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load run log.');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">Enrollments</h2>
          <p className="mt-0.5 text-xs text-slate-500">Leads currently in this workflow and their step history.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-slate-200 bg-canvas-cool p-0.5">
            <button
              type="button"
              onClick={() => selectTab('production')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${tab === 'production' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => selectTab('test')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${tab === 'test' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Test runs
            </button>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={loadEnrollments}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4">
        {enrollments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-canvas-cool px-4 py-8 text-center text-sm text-slate-500">
            {tab === 'test'
              ? 'No test runs yet. Use Test mode in the builder to dry-run this workflow.'
              : 'No live enrollments yet. Enrollments appear when leads enter this active workflow.'}
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Lead</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Current step</DataTableHeaderCell>
              <DataTableHeaderCell>Next run</DataTableHeaderCell>
              <DataTableHeaderCell>Enrolled</DataTableHeaderCell>
              <DataTableHeaderCell className="w-10">
                <span className="sr-only">Run log</span>
              </DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {enrollments.map((enrollment) => {
                const expanded = expandedId === enrollment.id;
                return (
                  <Fragment key={enrollment.id}>
                    <DataTableRow>
                      <DataTableCell>
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${enrollment.leadId}`}
                            className="truncate text-sm font-semibold text-slate-800 hover:text-brand"
                          >
                            {enrollment.leadName || 'Unnamed lead'}
                          </Link>
                          <p className="truncate text-xs text-slate-500">{enrollment.leadEmail}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Pill tone={enrollmentStatusTone(enrollment.status)}>
                          {automationEnrollmentStatusLabel(enrollment.status)}
                        </Pill>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="font-mono text-xs text-slate-600">{enrollment.currentNodeId || '—'}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-xs text-slate-600">{formatWhen(enrollment.nextRunAt)}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-xs text-slate-600">{formatWhen(enrollment.enrolledAt)}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <button
                          type="button"
                          onClick={() => toggleLog(enrollment.id)}
                          className="text-slate-500 hover:text-slate-800"
                          aria-label={expanded ? 'Hide run log' : 'Show run log'}
                        >
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </DataTableCell>
                    </DataTableRow>
                    {expanded ? (
                      <DataTableRow>
                        <DataTableCell colSpan={6}>
                          <div className="py-2">
                            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Run log</p>
                            <AutomationRunLogList entries={logsByEnrollment[enrollment.id] ?? []} />
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
