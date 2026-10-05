'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { previewWhatsAppTemplateParamsAction, sendLeadWhatsAppAction } from '@/app/(crm)/customers/actions';
import { WhatsAppAccountSelect } from '@/components/comms/whatsapp-account-select';
import { WhatsAppTemplateSelect } from '@/components/comms/whatsapp-template-select';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { fetchWhatsAppAccountsClient, fetchWhatsAppTemplatesClient } from '@/lib/comms-templates-client';
import { resolveWhatsAppAccountId } from '@/lib/whatsapp-account';
import { parseWhatsAppTemplateContent } from '@/lib/whatsapp-template-content';
import type { WhatsAppAccount, WhatsAppTemplate, WhatsAppTemplateParamsPreview } from '@/utils/api';

type SendWhatsAppDialogProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  templates?: WhatsAppTemplate[];
  defaultAccountId?: string;
  onSent: () => void;
};

function customParamDefaults(template: WhatsAppTemplate | undefined): Record<string, string> {
  if (!template) return {};
  const form = parseWhatsAppTemplateContent(template.content ?? template.liveContent, template.runtimeParams);
  const out: Record<string, string> = {};
  for (const variable of form.variables) {
    if (variable.leadField) continue;
    out[variable.name] = variable.example;
  }
  return out;
}

export function SendWhatsAppDialog({
  open,
  onClose,
  leadId,
  templates: initialTemplates = [],
  defaultAccountId,
  onSent,
}: SendWhatsAppDialogProps) {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  const [resolvedDefaultAccountId, setResolvedDefaultAccountId] = useState(defaultAccountId ?? '');
  const [accountId, setAccountId] = useState('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<WhatsAppTemplateParamsPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTemplates = templates.filter((template) => template.status === 'active');
  const selectedTemplate = activeTemplates.find((template) => template.id === templateId);
  const customDefaults = useMemo(() => customParamDefaults(selectedTemplate), [selectedTemplate]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void fetchWhatsAppAccountsClient()
      .then((payload) => {
        if (cancelled) return;
        setAccounts(payload.accounts);
        setAccountLocked(payload.accountLocked);
        const defaultId = resolveWhatsAppAccountId(defaultAccountId, payload.accounts, payload.defaultAccountId);
        setResolvedDefaultAccountId(defaultId);
        setAccountId(defaultId);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load WhatsApp accounts.');
      });

    return () => {
      cancelled = true;
    };
  }, [open, defaultAccountId]);

  useEffect(() => {
    if (!open || !accountId) {
      return;
    }

    let cancelled = false;
    setTemplatesLoading(true);
    void fetchWhatsAppTemplatesClient(accountId)
      .then((rows) => {
        if (cancelled) return;
        setTemplates(rows);
        const firstActive = rows.find((template) => template.status === 'active');
        setTemplateId(firstActive?.id ?? '');
        setTemplatesLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTemplates([]);
        setTemplateId('');
        setTemplatesLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to load templates.');
      });

    return () => {
      cancelled = true;
    };
  }, [open, accountId]);

  useEffect(() => {
    if (!open) return;
    setOverrides(customDefaults);
  }, [open, templateId, customDefaults]);

  useEffect(() => {
    if (!open || !templateId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void previewWhatsAppTemplateParamsAction(templateId, { leadId, params: overrides }).then((result) => {
      if (cancelled) return;
      if (result.error || !result.preview) {
        setPreview(null);
        setError(result.error ?? 'Failed to preview message.');
        return;
      }
      setPreview(result.preview);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, templateId, leadId, overrides]);

  if (!open) return null;

  const customNames = Object.keys(customDefaults);
  const canSend = Boolean(templateId) && (preview?.missing.length ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-slate-800">Send WhatsApp</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Choose an active template to send to this lead.</p>

        {accounts.length > 0 ? (
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            WhatsApp account
            <WhatsAppAccountSelect
              accounts={accounts}
              value={accountId || resolvedDefaultAccountId}
              onChange={setAccountId}
              accountLocked={accountLocked}
              disabled={isPending || templatesLoading}
            />
          </label>
        ) : null}

        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Template
          <WhatsAppTemplateSelect
            templates={activeTemplates}
            value={templateId}
            onChange={setTemplateId}
            disabled={isPending || templatesLoading}
            emptyMessage={templatesLoading ? 'Loading templates…' : 'No active templates'}
          />
        </label>

        {customNames.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">Custom variables</p>
            {customNames.map((name) => (
              <Field key={name} label={`{{${name}}}`}>
                <TextInput
                  value={overrides[name] ?? ''}
                  onChange={(value) => setOverrides((current) => ({ ...current, [name]: value }))}
                  placeholder="Value for this send"
                  disabled={isPending}
                />
              </Field>
            ))}
          </div>
        ) : null}

        {preview?.previewText ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">Preview</p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{preview.previewText}</p>
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
            leftIcon={<WhatsAppIcon />}
            loading={isPending}
            loadingLabel="Sending…"
            disabled={isPending || !canSend || templatesLoading}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const { error: sendError } = await sendLeadWhatsAppAction(
                  leadId,
                  templateId,
                  overrides,
                  accountId || resolvedDefaultAccountId || undefined
                );
                if (sendError) {
                  setError(sendError);
                  return;
                }
                onSent();
                onClose();
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
