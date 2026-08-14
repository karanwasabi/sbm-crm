'use client';

import { useEffect, useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { previewEmailTemplateAction, sendLeadEmailAction } from '@/app/(crm)/customers/actions';
import { EmailInboxPreview } from '@/components/comms/email-inbox-preview';
import { EmailInboxPreviewSkeleton } from '@/components/comms/bulk-send-list-row-skeleton';
import { Button } from '@/components/ui/button';
import type { EmailTemplate, EmailTemplatePreview } from '@/utils/api';

type SendEmailDialogProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  templates: EmailTemplate[];
  onSent: () => void;
};

export function SendEmailDialog({ open, onClose, leadId, templates, onSent }: SendEmailDialogProps) {
  const [templateId, setTemplateId] = useState(templates.find((t) => t.status === 'active')?.id ?? '');
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeTemplates = templates.filter((template) => template.status === 'active');

  useEffect(() => {
    if (!open || !templateId) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreview(null);
    setError(null);

    void previewEmailTemplateAction(templateId, leadId).then((result) => {
      if (cancelled) return;
      setPreviewLoading(false);
      if (result.error || !result.preview) {
        setPreview(null);
        setError(result.error ?? 'Failed to preview email.');
        return;
      }
      setPreview(result.preview);
    });

    return () => {
      cancelled = true;
    };
  }, [open, templateId, leadId]);

  if (!open) return null;

  const canSend = Boolean(templateId) && Boolean(preview) && preview.missing.length === 0 && !previewLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-slate-800">Send email</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Choose an active template to send to this lead.</p>

        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Template
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={isPending}
          >
            {activeTemplates.length === 0 ? <option value="">No active templates</option> : null}
            {activeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.classification})
              </option>
            ))}
          </select>
        </label>

        {templateId ? (
          <div className="mt-4">
            {previewLoading ? <EmailInboxPreviewSkeleton /> : null}
            {preview && !previewLoading ? (
              <EmailInboxPreview
                from={preview.from}
                to={preview.leadEmail}
                subject={preview.subject}
                html={preview.html}
                caption={preview.leadName ? `Preview for ${preview.leadName}` : undefined}
              />
            ) : null}
          </div>
        ) : null}

        {preview && preview.missing.length > 0 ? (
          <p className="mt-3 text-sm font-medium text-danger-press">
            Missing values: {preview.missing.map((name) => `{{${name}}}`).join(', ')}
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="light" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            loading={isPending}
            loadingLabel="Sending…"
            disabled={isPending || !canSend}
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
