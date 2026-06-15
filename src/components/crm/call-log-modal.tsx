'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { logLeadCall } from '@/app/(crm)/customers/actions';
import { CallOutcomeSelect } from '@/components/crm/call-outcome-select';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { contactOutcomeMarksLost, type ContactOutcome } from '@/types/crm';

type CallLogModalProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSaved: () => void;
};

export function CallLogModal({ open, onClose, leadId, onSaved }: CallLogModalProps) {
  const [outcome, setOutcome] = useState<ContactOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const willMarkLost = outcome !== '' && contactOutcomeMarksLost(outcome);

  useEffect(() => {
    if (!open) {
      setOutcome('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!outcome) {
      setError('Select a call outcome.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await logLeadCall(leadId, {
        outcome,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onSaved();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Log call</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent p-1 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3.5">
          <Field label="Outcome">
            <CallOutcomeSelect value={outcome} onChange={setOutcome} disabled={pending} />
          </Field>
          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Brief notes from the call"
              rows={3}
              disabled={pending}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-end justify-between gap-4 pt-2">
            <div className="min-w-0 flex-1">
              {willMarkLost && (
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-rose-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  This lead will be marked as lost when you save.
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="light" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={pending}>
                Save log
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
