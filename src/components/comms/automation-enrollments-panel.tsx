'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState, useTransition } from 'react';
import { getAutomationEnrollmentLogAction, listAutomationEnrollmentsAction } from '@/app/(crm)/communications/actions';
import { AutomationRunLogList } from '@/components/comms/automation-run-log-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { automationEnrollmentStatusLabel, resolveStepLabel } from '@/lib/automation-types';
import type { AutomationEnrollment, AutomationGraph, AutomationRunLogEntry } from '@/lib/automation-types';

type AutomationEnrollmentsPanelProps = {
  automationId: string;
  graphJson?: AutomationGraph;
};

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

export function AutomationEnrollmentsPanel({ automationId, graphJson }: AutomationEnrollmentsPanelProps) {
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logsByEnrollment, setLogsByEnrollment] = useState<Record<string, AutomationRunLogEntry[]>>({});
  const [loadingLogId, setLoadingLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadEnrollments = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const rows = await listAutomationEnrollmentsAction(automationId);
        setEnrollments(rows);
        setExpandedId(null);
        setLogsByEnrollment({});
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load enrollments.');
      }
    });
  }, [automationId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const toggleLog = (enrollmentId: string) => {
    if (expandedId === enrollmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(enrollmentId);
    if (logsByEnrollment[enrollmentId]) {
      return;
    }
    setLoadingLogId(enrollmentId);
    startTransition(async () => {
      try {
        const log = await getAutomationEnrollmentLogAction(enrollmentId);
        setLogsByEnrollment((current) => ({ ...current, [enrollmentId]: log }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load run log.');
      } finally {
        setLoadingLogId((current) => (current === enrollmentId ? null : current));
      }
    });
  };

  return (
    <Card padding="sm">
      <SectionHead
        title="Enrollments"
        subtitle="Leads in this workflow and their step history."
        right={
          <Button
            variant="light"
            size="sm"
            disabled={isPending}
            onClick={loadEnrollments}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
        className="mb-0"
      />

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4">
        {isPending && enrollments.length === 0 ? (
          <TableSkeleton columns={6} rows={5} embedded />
        ) : enrollments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-canvas-cool px-4 py-8 text-center text-sm text-slate-500">
            No enrollments yet. Enrollments appear when leads enter this active workflow.
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
                        <span className="text-xs text-slate-600">
                          {resolveStepLabel(graphJson, enrollment.currentNodeId)}
                        </span>
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
                            <SectionHead title="Step history" className="mb-2" />
                            {loadingLogId === enrollment.id ? (
                              <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, index) => (
                                  <Skeleton key={index} className="h-14 w-full rounded-xl" />
                                ))}
                              </div>
                            ) : (
                              <AutomationRunLogList entries={logsByEnrollment[enrollment.id] ?? []} />
                            )}
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
    </Card>
  );
}
