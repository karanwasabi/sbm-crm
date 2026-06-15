'use client';

import { X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { logLeadCall } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { CONTACT_OUTCOME_OPTIONS, type ContactOutcome } from '@/types/crm';

type CallLogModalProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSaved: () => void;
  onSuggestMarkLost: () => void;
};

export function CallLogModal({ open, onClose, leadId, onSaved, onSuggestMarkLost }: CallLogModalProps) {
  const [outcome, setOutcome] = useState<ContactOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

      setOutcome('');
      setNotes('');
      onSaved();

      if (result.suggestMarkLost) {
        onSuggestMarkLost();
      }
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
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as ContactOutcome)}
              disabled={pending}
              className="w-full rounded-[14px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Select outcome</option>
              {CONTACT_OUTCOME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <div className="flex justify-end gap-2 pt-2">
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
  );
}
