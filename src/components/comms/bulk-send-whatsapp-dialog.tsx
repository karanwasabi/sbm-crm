'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import {
  getBulkLeadWhatsAppSendJobAction,
  previewBulkLeadWhatsAppSendAction,
  startBulkLeadWhatsAppSendAction,
} from '@/app/(crm)/database/actions';
import { BulkSendPreviewSkeleton } from '@/components/comms/bulk-send-list-row-skeleton';
import { bulkWhatsAppSkipTotal, formatBulkWhatsAppSkipSummary } from '@/lib/bulk-send-display';
import { commsBulkSendHref } from '@/lib/comms-channel';
import { Button } from '@/components/ui/button';
import type { BulkLeadWhatsAppPreview, BulkLeadWhatsAppSendJob, WhatsAppTemplate } from '@/utils/api';

type BulkSendWhatsAppDialogProps = {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  templates: WhatsAppTemplate[];
};

function formatSkipSummary(preview: BulkLeadWhatsAppPreview): string[] {
  return formatBulkWhatsAppSkipSummary(preview.skipped);
}

export function BulkSendWhatsAppDialog({ open, onClose, leadIds, templates }: BulkSendWhatsAppDialogProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [preview, setPreview] = useState<BulkLeadWhatsAppPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmDuplicates, setConfirmDuplicates] = useState(false);
  const [job, setJob] = useState<BulkLeadWhatsAppSendJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startSendTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewLoading(false);
      setConfirmDuplicates(false);
      setJob(null);
      setError(null);
      setTemplateId(templates[0]?.id ?? '');
      return;
    }
    if (!templateId) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreview(null);
    setPreviewLoading(true);
    setConfirmDuplicates(false);

    void (async () => {
      const result = await previewBulkLeadWhatsAppSendAction(templateId, leadIds);
      if (!cancelled) {
        setPreviewLoading(false);
        if (result.error) {
          setPreview(null);
          setError(result.error);
        } else {
          setPreview(result.preview);
          setError(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, templateId, leadIds, templates]);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    const timer = window.setInterval(() => {
      void getBulkLeadWhatsAppSendJobAction(job.id).then((result) => {
        if (result.job) {
          setJob(result.job);
        } else if (result.error) {
          setError(result.error);
        }
      });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [job]);

  const startSend = (skipAlreadySent: boolean) => {
    setError(null);
    startSendTransition(async () => {
      const result = await startBulkLeadWhatsAppSendAction(templateId, leadIds, { skipAlreadySent });
      if (result.error || !result.job) {
        setError(result.error ?? 'Failed to start bulk send.');
        return;
      }
      setConfirmDuplicates(false);
      setJob(result.job);
    });
  };

  if (!open) {
    return null;
  }

  const skippedTotal = preview ? bulkWhatsAppSkipTotal(preview.skipped) : 0;
  const skipLines = preview ? formatSkipSummary(preview) : [];
  const sending = Boolean(job && job.status !== 'completed' && job.status !== 'failed');
  const finished = job?.status === 'completed' || job?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-slate-800">Send WhatsApp to selected leads</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {leadIds.length.toLocaleString('en-IN')} lead{leadIds.length === 1 ? '' : 's'} selected.
        </p>

        {!job ? (
          <>
            {!confirmDuplicates ? (
              <>
                <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                  Template
                  <select
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                    value={templateId}
                    onChange={(event) => setTemplateId(event.target.value)}
                    disabled={previewLoading || isSending || sending}
                  >
                    {templates.length === 0 ? <option value="">No active templates</option> : null}
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                </label>

                {previewLoading ? <BulkSendPreviewSkeleton /> : null}

                {preview && !previewLoading ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-canvas-cool px-4 py-3 text-sm text-slate-700">
                    <p>
                      <span className="font-extrabold text-slate-900">{preview.will_send.toLocaleString('en-IN')}</span>{' '}
                      will be sent.
                    </p>
                    {preview.already_sent > 0 ? (
                      <p className="mt-1">
                        <span className="font-extrabold text-amber-700">
                          {preview.already_sent.toLocaleString('en-IN')}
                        </span>{' '}
                        have already received this template.
                      </p>
                    ) : null}
                    {skippedTotal > 0 ? (
                      <p className="mt-1">
                        <span className="font-extrabold text-slate-900">{skippedTotal.toLocaleString('en-IN')}</span>{' '}
                        will be skipped
                        {skipLines.length > 0 ? ` (${skipLines.join(', ')})` : ''}.
                      </p>
                    ) : (
                      <p className="mt-1 text-slate-500">No leads will be skipped for consent or eligibility.</p>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-extrabold text-slate-900">Some leads already received this template</p>
                <p className="mt-2">
                  <span className="font-extrabold text-slate-900">{preview?.already_sent.toLocaleString('en-IN')}</span>{' '}
                  selected lead{(preview?.already_sent ?? 0) === 1 ? '' : 's'} already got this message (sent or
                  in-flight).
                </p>
                <p className="mt-2 text-slate-600">
                  Skip them and send only to{' '}
                  <span className="font-bold text-slate-900">
                    {preview?.will_send_if_skip_duplicates.toLocaleString('en-IN')}
                  </span>{' '}
                  others, or send to all{' '}
                  <span className="font-bold text-slate-900">{preview?.will_send.toLocaleString('en-IN')}</span>{' '}
                  eligible leads again.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-canvas-cool px-4 py-3 text-sm text-slate-700">
            {finished ? (
              <>
                <p className="font-extrabold text-slate-900">
                  {job.status === 'completed' ? 'Bulk send finished' : 'Bulk send failed'}
                </p>
                <p className="mt-1">
                  Sent {job.sent.toLocaleString('en-IN')} · Skipped {job.skipped.toLocaleString('en-IN')} · Failed{' '}
                  {job.failed.toLocaleString('en-IN')}
                </p>
                {job.error_message ? <p className="mt-2 font-medium text-danger-press">{job.error_message}</p> : null}
              </>
            ) : (
              <>
                <p className="font-extrabold text-slate-900">Sending WhatsApp messages…</p>
                <p className="mt-1">
                  Sent {job.sent.toLocaleString('en-IN')} · Skipped {job.skipped.toLocaleString('en-IN')} · Failed{' '}
                  {job.failed.toLocaleString('en-IN')}
                </p>
              </>
            )}
            <p className="mt-3 text-xs font-medium text-slate-500">
              {sending ? 'Sending continues if you close this dialog. ' : null}
              <Link href={commsBulkSendHref('whatsapp', job.id)} className="font-bold text-brand hover:underline">
                View job details
              </Link>
            </p>
          </div>
        )}

        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}

        <div
          className={!job && confirmDuplicates ? 'mt-5 flex flex-col gap-2' : 'mt-5 flex flex-wrap justify-end gap-2'}
        >
          {!job && confirmDuplicates ? (
            <>
              <Button
                variant="light"
                fullWidth
                className="[&>span]:text-center [&>span]:whitespace-normal"
                loading={isSending}
                loadingLabel="Starting…"
                disabled={isSending || !preview || preview.will_send_if_skip_duplicates === 0}
                onClick={() => startSend(true)}
              >
                Skip & send to {preview?.will_send_if_skip_duplicates.toLocaleString('en-IN')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                className="[&>span]:text-center [&>span]:whitespace-normal"
                loading={isSending}
                loadingLabel="Starting…"
                disabled={isSending || !preview || preview.will_send === 0}
                onClick={() => startSend(false)}
              >
                Send to all {preview?.will_send.toLocaleString('en-IN')}
              </Button>
            </>
          ) : null}
          <Button
            variant="light"
            fullWidth={!job && confirmDuplicates}
            className={!job && confirmDuplicates ? '[&>span]:text-center' : undefined}
            onClick={onClose}
          >
            {job ? 'Close' : 'Cancel'}
          </Button>
          {!job && !confirmDuplicates ? (
            <Button
              variant="primary"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              loading={isSending}
              loadingLabel="Starting…"
              disabled={previewLoading || isSending || !templateId || !preview || preview.will_send === 0}
              onClick={() => {
                if (preview && preview.already_sent > 0) {
                  setConfirmDuplicates(true);
                  return;
                }
                startSend(false);
              }}
            >
              Send now
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
