'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

type CallLogModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CallLogModal({ open, onClose }: CallLogModalProps) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Log call</h3>
          <button type="button" onClick={onClose} className="cursor-pointer border-none bg-transparent p-1 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3.5">
          <Field label="Outcome">
            <TextInput value={outcome} onChange={setOutcome} placeholder="Interested, Busy, No answer…" />
          </Field>
          <Field label="Notes">
            <TextInput value={notes} onChange={setNotes} placeholder="Brief notes from the call" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onClose}>
              Save log
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
