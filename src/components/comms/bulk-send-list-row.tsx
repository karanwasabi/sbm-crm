import { Send } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui/pill';
import { bulkJobStatusLabel, bulkJobStatusTone, formatCommsWhen } from '@/lib/comms-display';
import type { BulkLeadEmailSendJob } from '@/utils/api';

type BulkSendListRowProps = {
  job: BulkLeadEmailSendJob;
};

export function BulkSendListRow({ job }: BulkSendListRowProps) {
  const templateName = job.template_name ?? 'Unknown template';
  const progressLabel = `${job.sent.toLocaleString('en-IN')} sent · ${job.skipped.toLocaleString('en-IN')} skipped · ${job.failed.toLocaleString('en-IN')} failed`;

  return (
    <Link
      href={`/communications/bulk-sends/${job.id}`}
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
        {job.template_classification ? (
          <Pill tone={job.template_classification === 'marketing' ? 'brand' : 'neutral'}>
            {job.template_classification === 'marketing' ? 'Marketing' : 'Transactional'}
          </Pill>
        ) : null}
        <Pill tone={bulkJobStatusTone(job.status)}>{bulkJobStatusLabel(job.status)}</Pill>
      </div>
    </Link>
  );
}
