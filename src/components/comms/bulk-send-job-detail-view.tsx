'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getBulkLeadEmailSendJobAction, listBulkLeadEmailSendJobSendsAction } from '@/app/(crm)/communications/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { bulkSkipTotal, formatBulkSkipSummary } from '@/lib/bulk-send-display';
import {
  bulkJobStatusLabel,
  bulkJobStatusTone,
  emailSendStatusLabel,
  emailSendStatusTone,
  formatCommsWhen,
} from '@/lib/comms-display';
import type { BulkLeadEmailSendJob, BulkLeadEmailSendRow } from '@/utils/api';

const PAGE_SIZE = 50;

type BulkSendJobDetailViewProps = {
  initialJob: BulkLeadEmailSendJob;
};

export function BulkSendJobDetailView({ initialJob }: BulkSendJobDetailViewProps) {
  const [job, setJob] = useState(initialJob);
  const [sends, setSends] = useState<BulkLeadEmailSendRow[]>([]);
  const [sendTotal, setSendTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [sendsLoading, setSendsLoading] = useState(true);
  const [sendsError, setSendsError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const isActive = job.status === 'queued' || job.status === 'running';
  const skipLines = formatBulkSkipSummary(job.skip_breakdown);
  const skippedTotal = bulkSkipTotal(job.skip_breakdown);

  const loadSends = useCallback(async (jobId: string, pageIndex: number, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setSendsLoading(true);
    }
    const result = await listBulkLeadEmailSendJobSendsAction(jobId, {
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
    });
    if (result.error || !result.data) {
      setSendsError(result.error ?? 'Failed to load recipients.');
      if (!options?.silent) {
        setSendsLoading(false);
      }
      return;
    }
    setSendsError(null);
    setSends(result.data.items);
    setSendTotal(result.data.total);
    if (!options?.silent) {
      setSendsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSends(job.id, page);
  }, [job.id, page, loadSends]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void getBulkLeadEmailSendJobAction(job.id).then((result) => {
        if (result.job) {
          setJob(result.job);
          setJobError(null);
        } else if (result.error) {
          setJobError(result.error);
        }
      });
      void loadSends(job.id, page, { silent: true });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [isActive, job.id, page, loadSends]);

  const pageCount = Math.max(1, Math.ceil(sendTotal / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < pageCount;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHead
          title={job.template_name ?? 'Bulk send'}
          subtitle={job.sent_by_name ? `Started by ${job.sent_by_name}` : 'Campaign send from Lead Database'}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={bulkJobStatusTone(job.status)}>{bulkJobStatusLabel(job.status)}</Pill>
          {job.template_classification ? (
            <Pill tone={job.template_classification === 'marketing' ? 'brand' : 'neutral'}>
              {job.template_classification === 'marketing' ? 'Marketing' : 'Transactional'}
            </Pill>
          ) : null}
          {job.template_id ? (
            <Link
              href={`/communications/templates/${job.template_id}`}
              className="text-xs font-bold text-brand hover:underline"
            >
              View template
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 text-sm text-slate-700">
            <p>
              <span className="font-extrabold text-slate-900">{job.sent.toLocaleString('en-IN')}</span> sent
            </p>
            <p className="mt-1">
              <span className="font-extrabold text-slate-900">{job.skipped.toLocaleString('en-IN')}</span> skipped
              {skippedTotal > 0 && skipLines.length > 0 ? ` (${skipLines.join(', ')})` : ''}
            </p>
            <p className="mt-1">
              <span className="font-extrabold text-slate-900">{job.failed.toLocaleString('en-IN')}</span> failed ·{' '}
              <span className="font-extrabold text-slate-900">{job.selected.toLocaleString('en-IN')}</span> selected
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-600">Created:</span> {formatCommsWhen(job.created_at)}
            </p>
            {job.started_at ? (
              <p className="mt-1">
                <span className="font-semibold text-slate-600">Started:</span> {formatCommsWhen(job.started_at)}
              </p>
            ) : null}
            {job.completed_at ? (
              <p className="mt-1">
                <span className="font-semibold text-slate-600">Completed:</span> {formatCommsWhen(job.completed_at)}
              </p>
            ) : null}
            {isActive ? (
              <p className="mt-2 text-xs font-medium text-brand">Refreshing while job is in progress…</p>
            ) : null}
          </div>
        </div>

        {job.error_message ? <p className="mt-3 text-sm font-medium text-danger-press">{job.error_message}</p> : null}
        {jobError ? <p className="mt-3 text-sm font-medium text-danger-press">{jobError}</p> : null}
      </Card>

      <Card>
        <SectionHead
          title="Recipients"
          subtitle={
            sendTotal > 0
              ? `${sendTotal.toLocaleString('en-IN')} recorded · leads skipped without a row may not appear`
              : 'No per-recipient rows recorded yet'
          }
        />
        {sendsError ? <p className="text-sm font-medium text-danger-press">{sendsError}</p> : null}
        {sendsLoading ? (
          <TableSkeleton columns={4} rows={8} embedded />
        ) : sends.length === 0 && !sendsError ? (
          <p className="text-sm text-slate-500">
            {isActive ? 'Recipient rows will appear as the job processes leads.' : 'No recipient rows for this job.'}
          </p>
        ) : (
          <>
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Recipient</DataTableHeaderCell>
                <DataTableHeaderCell>Subject</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Sent</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {sends.map((send) => (
                  <DataTableRow key={send.id}>
                    <DataTableCell>
                      {send.lead_id ? (
                        <Link href={`/customers/${send.lead_id}`} className="font-semibold text-brand hover:underline">
                          {send.recipient_email}
                        </Link>
                      ) : (
                        send.recipient_email
                      )}
                      {send.skip_reason ? <p className="mt-0.5 text-xs text-slate-500">{send.skip_reason}</p> : null}
                    </DataTableCell>
                    <DataTableCell className="max-w-[12rem] truncate">{send.subject_rendered || '—'}</DataTableCell>
                    <DataTableCell>
                      <Pill tone={emailSendStatusTone(send.status)}>{emailSendStatusLabel(send.status)}</Pill>
                    </DataTableCell>
                    <DataTableCell>{formatCommsWhen(send.sent_at ?? undefined)}</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
            {sendTotal > PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Page {page + 1} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="light"
                    size="sm"
                    disabled={!canPrev || sendsLoading}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    disabled={!canNext || sendsLoading}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
