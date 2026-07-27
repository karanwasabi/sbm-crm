import { Send } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui/pill';
import { commsBulkSendHref, type CommsChannel } from '@/lib/comms-channel';
import { bulkJobStatusLabel, bulkJobStatusTone, formatCommsWhen } from '@/lib/comms-display';
import type { BulkLeadEmailSendJob, BulkLeadWhatsAppSendJob } from '@/utils/api';

type BulkSendListRowProps = {
  job: BulkLeadEmailSendJob | BulkLeadWhatsAppSendJob;
  channel?: CommsChannel;
};

export function BulkSendListRow({ job, channel = 'email' }: BulkSendListRowProps) {
  const templateName = job.template_name ?? 'Unknown template';
  const progressLabel = `${job.sent.toLocaleString('en-IN')} sent · ${job.skipped.toLocaleString('en-IN')} skipped · ${job.failed.toLocaleString('en-IN')} failed`;
  const classification =
    channel === 'email'
      ? (job as BulkLeadEmailSendJob).template_classification
      : (job as BulkLeadWhatsAppSendJob).template_category;

  return (
    <Link
      href={commsBulkSendHref(channel, job.id)}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 transition hover:border-brand/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Send className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">{templateName}</p>
          <p className="truncate text-xs font-medium text-slate-500">
            {job.selected.toLocaleString('en-IN')} selected · {progressLabel}
          </p>
          <p className="truncate text-xs text-slate-400">
            {formatCommsWhen(job.created_at)}
            {job.sent_by_name ? ` · ${job.sent_by_name}` : ''}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        {classification ? (
          <Pill tone={classification === 'marketing' ? 'brand' : 'neutral'}>
            {classification === 'marketing' ? 'Marketing' : channel === 'email' ? 'Transactional' : classification}
          </Pill>
        ) : null}
        <Pill tone={bulkJobStatusTone(job.status)}>{bulkJobStatusLabel(job.status)}</Pill>
      </div>
    </Link>
  );
}
