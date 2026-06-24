'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { sendLeadEmailAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import type { EmailTemplate } from '@/utils/api';

type SendEmailDialogProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  templates: EmailTemplate[];
  onSent: () => void;
};

export function SendEmailDialog({ open, onClose, leadId, templates, onSent }: SendEmailDialogProps) {
  const [templateId, setTemplateId] = useState(templates.find((t) => t.status === 'active')?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const activeTemplates = templates.filter((template) => template.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-slate-800">Send email</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Choose an active template to send to this lead.</p>

        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Template
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {activeTemplates.length === 0 ? <option value="">No active templates</option> : null}
            {activeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.classification})
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="light" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            disabled={isPending || !templateId}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await sendLeadEmailAction(leadId, templateId);
                  onSent();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to send email.');
                }
              });
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
