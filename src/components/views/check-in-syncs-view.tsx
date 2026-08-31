'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { resolveCheckInSyncIssueAction } from '@/app/(crm)/check-in-syncs/actions';
import { CheckInEditorDialog } from '@/components/crm/check-in-editor-dialog';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { useToast } from '@/components/ui/toast';
import type { CheckInSyncIssue } from '@/utils/api';

const FILTERS = [
  { id: '', label: 'Open' },
  { id: 'failing', label: 'Failing' },
  { id: 'expired', label: 'Expired' },
] as const;

function statusTone(status: string): 'warn' | 'danger' | 'neutral' | 'success' {
  if (status === 'failing') return 'warn';
  if (status === 'expired') return 'danger';
  return 'success';
}

function memberLabel(issue: CheckInSyncIssue): string {
  const name = [issue.firstName, issue.lastName].filter(Boolean).join(' ').trim();
  return name || issue.email || issue.userId.slice(0, 8);
}

type CheckInSyncsViewProps = {
  count: number;
  issues: CheckInSyncIssue[];
  status: string;
};

export function CheckInSyncsView({ count, issues, status }: CheckInSyncsViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<{ leadId: string; localDate: string } | null>(null);

  const subtitle = useMemo(
    () => `${count} ${count === 1 ? 'issue' : 'issues'}${status ? ` · ${status.replaceAll('_', ' ')}` : ''}`,
    [count, status]
  );

  const resolve = (issue: CheckInSyncIssue) => {
    startTransition(async () => {
      const { error } = await resolveCheckInSyncIssueAction(issue.userId, issue.localDate);
      if (error) {
        toast({ message: error, variant: 'error' });
        return;
      }
      toast({ message: 'Marked resolved.', variant: 'success' });
      router.refresh();
    });
  };

  return (
    <>
      <Card>
        <SectionHead title="Check-in syncs" subtitle={subtitle} />
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id || 'open'}
              href={f.id ? `/check-in-syncs?status=${encodeURIComponent(f.id)}` : '/check-in-syncs'}
              active={status === f.id}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        {issues.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No open check-in sync issues.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Member</DataTableHeaderCell>
              <DataTableHeaderCell>Day</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Attempts</DataTableHeaderCell>
              <DataTableHeaderCell>Last error</DataTableHeaderCell>
              <DataTableHeaderCell>Updated</DataTableHeaderCell>
              <DataTableHeaderCell>Actions</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {issues.map((issue) => (
                <DataTableRow key={`${issue.userId}:${issue.localDate}`}>
                  <DataTableCell>
                    {issue.leadId ? (
                      <Link
                        href={`/customers/${issue.leadId}`}
                        className="block rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <div className="font-semibold text-slate-800">{memberLabel(issue)}</div>
                        {issue.email ? <div className="text-xs text-slate-500">{issue.email}</div> : null}
                      </Link>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-800">{memberLabel(issue)}</div>
                        {issue.email ? <div className="text-xs text-slate-500">{issue.email}</div> : null}
                      </>
                    )}
                  </DataTableCell>
                  <DataTableCell>{issue.localDate}</DataTableCell>
                  <DataTableCell>
                    <Pill tone={statusTone(issue.status)}>{issue.status.replaceAll('_', ' ')}</Pill>
                  </DataTableCell>
                  <DataTableCell>{issue.attempts}</DataTableCell>
                  <DataTableCell>
                    <span className="line-clamp-2 max-w-xs text-xs text-slate-600">{issue.lastError ?? '—'}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-slate-500">{new Date(issue.updatedAt).toLocaleString()}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap gap-2">
                      {issue.leadId ? (
                        <Button
                          variant="light"
                          onClick={() => setEditor({ leadId: issue.leadId!, localDate: issue.localDate })}
                        >
                          Open editor
                        </Button>
                      ) : null}
                      <Button variant="light" onClick={() => resolve(issue)} disabled={pending}>
                        Resolve
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      {editor ? (
        <CheckInEditorDialog
          leadId={editor.leadId}
          open
          initialLocalDate={editor.localDate}
          onOpenChange={(next) => {
            if (!next) {
              setEditor(null);
              router.refresh();
            }
          }}
        />
      ) : null}
    </>
  );
}
