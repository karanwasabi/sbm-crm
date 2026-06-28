'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { IntakeDuplicateCheckResult } from '@/types/crm';

type DuplicateLeadMergeDialogProps = {
  open: boolean;
  checkResult: IntakeDuplicateCheckResult;
  onClose: () => void;
  onAttachInquiry: () => void;
  onCreateSeparate?: () => void;
  pending: boolean;
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  city: 'City',
  country: 'Country',
};

export function DuplicateLeadMergeDialog({
  open,
  checkResult,
  onClose,
  onAttachInquiry,
  onCreateSeparate,
  pending,
}: DuplicateLeadMergeDialogProps) {
  const mergeOptions = checkResult.mergeOptions;
  const existing = checkResult.existing;
  const conflicts = checkResult.conflicts ?? [];
  const [confirmSeparate, setConfirmSeparate] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmSeparate(false);
    }
  }, [open]);

  if (!open || !existing || !mergeOptions) {
    return null;
  }

  const isEmailMatch = checkResult.matchType === 'email';
  const allowSeparateLead = checkResult.matchType === 'phone' && Boolean(onCreateSeparate);

  const subtitle = isEmailMatch
    ? 'This email is already on file. Add this inquiry to the existing lead—profile updates can be reviewed in Customer 360.'
    : 'This phone number matches an existing lead. Add this inquiry to their profile, or create a separate flagged lead if this is a different person.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lead already exists</h3>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent p-1 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mergeOptions.targetIsPayingMember ? (
          <div className="mb-4 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>This person has paid.</strong> Their profile cannot be changed from intake. This inquiry will be
              recorded on their profile for follow-up.
              {!isEmailMatch && allowSeparateLead
                ? ' If you believe this is a different person sharing the same phone number, you may create a separate flagged lead.'
                : null}
            </p>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Existing lead</p>
          <p className="mt-1 font-semibold text-slate-900">{existing.name}</p>
          <p className="text-slate-700">{existing.email}</p>
          {existing.phone ? <p className="text-slate-700">{existing.phone}</p> : null}
          <p className="mt-1 text-slate-600">
            Stage: {LIFECYCLE_STAGES[existing.stage].label}
            {existing.isPaying ? ' · Paying member' : ''}
          </p>
          <Link
            href={`/customers/${existing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-indigo-600"
          >
            Open Customer 360
          </Link>
        </div>

        {conflicts.length > 0 ? (
          <div className="mb-4">
            <p className="mb-1 text-sm font-semibold text-slate-800">Differs from profile</p>
            {!mergeOptions.targetIsPayingMember ? (
              <p className="mb-2 text-xs text-slate-500">
                These values will be saved with this inquiry. You can apply them to the profile later in Customer 360.
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              {conflicts.map((conflict) => (
                <div key={conflict.field} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <p className="font-semibold text-slate-800">{FIELD_LABELS[conflict.field] ?? conflict.field}</p>
                  <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">On profile</p>
                      <p className="font-medium text-slate-800">{conflict.currentValue || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">This inquiry</p>
                      <p className="font-medium text-slate-800">{conflict.intakeValue || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button type="button" disabled={pending} onClick={onAttachInquiry}>
            Add inquiry to this {existing.isPaying ? 'member' : 'lead'}
          </Button>

          {allowSeparateLead ? (
            !confirmSeparate ? (
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmSeparate(true)}>
                Create separate lead (flagged)
              </Button>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-950">
                  {existing.isPaying
                    ? 'This phone number is shared with a paying member. Only continue if you are confident this is a different person.'
                    : 'This will create a new lead flagged as a possible duplicate. The phone number will remain linked for review.'}
                </p>
                <Button
                  type="button"
                  className="mt-2 w-full"
                  variant="light"
                  disabled={pending}
                  onClick={onCreateSeparate}
                >
                  Confirm create separate lead
                </Button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
