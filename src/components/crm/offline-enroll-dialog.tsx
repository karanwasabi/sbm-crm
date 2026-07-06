'use client';

import { GraduationCap, Loader2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { offlineEnrollLeadAction, listOfflineEnrollCohortsAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatActivityTimestamp } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import type { OfflineEnrollCohort } from '@/types/crm';

type OfflineEnrollDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onEnrolled: () => void;
};

export function OfflineEnrollDialog({ open, onOpenChange, leadId, leadName, onEnrolled }: OfflineEnrollDialogProps) {
  const displayTimezone = useDisplayTimezone();
  const [cohorts, setCohorts] = useState<OfflineEnrollCohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingCohorts, startLoadCohorts] = useTransition();
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) {
      setSelectedCohortId('');
      setLoadError(null);
      setSubmitError(null);
      return;
    }

    startLoadCohorts(async () => {
      const result = await listOfflineEnrollCohortsAction();
      if (result.error || !result.cohorts) {
        setCohorts([]);
        setLoadError(result.error ?? 'Failed to load upcoming cohorts.');
        return;
      }
      setCohorts(result.cohorts);
      setLoadError(null);
      if (result.cohorts.length === 1) {
        setSelectedCohortId(result.cohorts[0].id);
      }
    });
  }, [open]);

  const handleSubmit = () => {
    if (!selectedCohortId) {
      setSubmitError('Select a cohort to continue.');
      return;
    }

    startSubmit(async () => {
      const result = await offlineEnrollLeadAction(leadId, selectedCohortId);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      onOpenChange(false);
      onEnrolled();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-brand" aria-hidden />
            Enroll offline
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-600">
            Enroll <span className="font-semibold text-slate-800">{leadName}</span> into an upcoming Take Control
            cohort. Portal access is granted for three months from cohort start; no recurring billing is created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {loadingCohorts ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading cohorts…
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : cohorts.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming Take Control cohorts are open for enrollment.</p>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="offline-enroll-cohort"
                className="text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                Cohort
              </label>
              <select
                id="offline-enroll-cohort"
                value={selectedCohortId}
                onChange={(event) => {
                  setSelectedCohortId(event.target.value);
                  setSubmitError(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 ring-brand/20 outline-none focus:ring-2"
              >
                <option value="">Select cohort…</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} · starts{' '}
                    {formatActivityTimestamp(`${cohort.startsOn}T00:00:00Z`, displayTimezone).split(',')[0]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loadingCohorts || cohorts.length === 0 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enrolling…
              </>
            ) : (
              'Enroll'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
