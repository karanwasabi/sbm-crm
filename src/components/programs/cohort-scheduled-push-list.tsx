'use client';

import { useEffect, useState, useTransition } from 'react';
import { cancelCohortPushBroadcastJobAction, listCohortPushBroadcastJobsAction } from '@/app/(crm)/programs/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import type { CohortPushBroadcastJob } from '@/utils/api';

type CohortScheduledPushListProps = {
  cohortId: string;
  refreshKey?: number;
};

function targetLabel(job: CohortPushBroadcastJob): string {
  if (job.selectedCount > 0) {
    return `${job.selectedCount} selected`;
  }
  return 'Whole cohort';
}

function statusLabel(status: CohortPushBroadcastJob['status']): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'running':
      return 'Sending';
    case 'completed':
      return 'Sent';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function CohortScheduledPushList({ cohortId, refreshKey = 0 }: CohortScheduledPushListProps) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CohortPushBroadcastJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listCohortPushBroadcastJobsAction(cohortId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setJobs([]);
        return;
      }
      setJobs(result.jobs);
    });
    return () => {
      cancelled = true;
    };
  }, [cohortId, refreshKey]);

  const handleCancel = (job: CohortPushBroadcastJob) => {
    const confirmed = window.confirm(`Cancel scheduled push "${job.title}"?`);
    if (!confirmed) return;

    startTransition(async () => {
      const { job: cancelledJob, error: cancelError } = await cancelCohortPushBroadcastJobAction(cohortId, job.id);
      if (cancelError || !cancelledJob) {
        toast({ message: cancelError ?? 'Failed to cancel scheduled push.', variant: 'error' });
        return;
      }
      setJobs((current) => current.map((item) => (item.id === cancelledJob.id ? cancelledJob : item)));
      toast({ message: 'Scheduled push cancelled.', variant: 'success' });
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-500">
        Loading scheduled pushes…
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-500">
        No scheduled or recent push broadcasts.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-extrabold text-slate-800">Push broadcasts</h3>
        <p className="mt-0.5 text-xs text-slate-500">Scheduled and recent one-off cohort pushes.</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {jobs.map((job) => (
          <li key={job.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{job.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{job.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{statusLabel(job.status)}</span>
                {' · '}
                {targetLabel(job)}
                {' · '}
                {formatDateTimeIST(job.scheduledAt)}
              </p>
              {job.status === 'completed' ? (
                <p className="mt-1 text-xs text-slate-500">
                  Reached {job.membersReached} member{job.membersReached === 1 ? '' : 's'} ({job.devicesSent} device
                  {job.devicesSent === 1 ? '' : 's'})
                </p>
              ) : null}
              {job.status === 'failed' && job.errorMessage ? (
                <p className="mt-1 text-xs text-rose-600">{job.errorMessage}</p>
              ) : null}
            </div>
            {job.status === 'scheduled' ? (
              <Button type="button" variant="light" size="sm" disabled={pending} onClick={() => handleCancel(job)}>
                Cancel
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
