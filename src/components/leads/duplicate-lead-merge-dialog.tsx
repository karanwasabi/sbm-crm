'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { IntakeDuplicateCheckResult, ManualLeadSource } from '@/types/crm';
import type { LeadFormValues } from '@/lib/lead-form';

type DuplicateLeadMergeDialogProps = {
  open: boolean;
  checkResult: IntakeDuplicateCheckResult;
  form: LeadFormValues & { manualSource: ManualLeadSource };
  onClose: () => void;
  onMergeProfile: (applyFields: string[]) => void;
  onAttachInquiry: () => void;
  onCreateSeparate: () => void;
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
  form,
  onClose,
  onMergeProfile,
  onAttachInquiry,
  onCreateSeparate,
  pending,
}: DuplicateLeadMergeDialogProps) {
  const mergeOptions = checkResult.mergeOptions;
  const existing = checkResult.existing;
  const conflicts = checkResult.conflicts ?? [];

  const defaultSelected = useMemo(() => {
    const selected = new Set<string>();
    for (const conflict of conflicts) {
      if (conflict.mergeAllowed) {
        selected.add(conflict.field);
      }
    }
    return selected;
  }, [conflicts]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(defaultSelected);
  const [confirmSeparate, setConfirmSeparate] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedFields(new Set(defaultSelected));
      setConfirmSeparate(false);
    }
  }, [open, defaultSelected]);

  if (!open || !existing || !mergeOptions) {
    return null;
  }

  const toggleField = (field: string) => {
    setSelectedFields((current) => {
      const next = new Set(current);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const matchLabel = checkResult.matchType === 'phone' ? 'phone number' : 'email';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lead already exists</h3>
            <p className="mt-1 text-sm text-slate-600">
              This {matchLabel} matches an existing lead. Choose how to proceed—you cannot save blindly.
            </p>
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
              <strong>This person has paid.</strong> Profile data cannot be changed from intake. Add the inquiry as a
              note or create a separate flagged lead if this is a different person.
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
          <Link href={`/customers/${existing.id}`} className="mt-2 inline-block text-sm font-semibold text-indigo-600">
            Open Customer 360
          </Link>
        </div>

        {conflicts.length > 0 && mergeOptions.profileMergeAllowed ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">Field differences</p>
            <div className="flex flex-col gap-2">
              {conflicts.map((conflict) => (
                <label
                  key={conflict.field}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${conflict.mergeAllowed ? 'border-slate-200' : 'border-slate-100 bg-slate-50 opacity-80'}`}
                >
                  <Checkbox
                    checked={selectedFields.has(conflict.field)}
                    disabled={!conflict.mergeAllowed || pending}
                    onChange={() => toggleField(conflict.field)}
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-slate-800">{FIELD_LABELS[conflict.field] ?? conflict.field}</p>
                    <p className="text-slate-600">
                      Current: <span className="font-medium text-slate-800">{conflict.currentValue || '—'}</span>
                    </p>
                    <p className="text-slate-600">
                      From entry: <span className="font-medium text-slate-800">{conflict.intakeValue || '—'}</span>
                    </p>
                    {!conflict.mergeAllowed ? (
                      <p className="mt-1 text-xs text-slate-500">Cannot change this field for this lead stage.</p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
            {mergeOptions.blockReason ? (
              <p className="mt-2 text-xs text-slate-500">{mergeOptions.blockReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {mergeOptions.attachInquiryOnly || mergeOptions.targetIsPayingMember ? (
            <Button type="button" disabled={pending} onClick={onAttachInquiry}>
              Add inquiry to this {existing.isPaying ? 'member' : 'lead'}
            </Button>
          ) : null}

          {mergeOptions.profileMergeAllowed ? (
            <Button
              type="button"
              variant="light"
              disabled={pending || selectedFields.size === 0}
              onClick={() => onMergeProfile(Array.from(selectedFields))}
            >
              Merge selected fields into existing lead
            </Button>
          ) : null}

          {!confirmSeparate ? (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmSeparate(true)}>
              Create separate lead (flagged)
            </Button>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-950">
                {existing.isPaying
                  ? 'This phone/email is shared with a paying member. Only confirm if you are sure this is a different person.'
                  : 'This will create a new lead flagged as a possible duplicate.'}
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
          )}
        </div>
      </div>
    </div>
  );
}
