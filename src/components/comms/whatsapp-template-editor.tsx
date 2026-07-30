'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import {
  activateWhatsAppTemplateAction,
  deactivateWhatsAppTemplateAction,
  saveWhatsAppTemplateAction,
  sendWhatsAppTemplateTestAction,
  submitWhatsAppTemplateAction,
} from '@/app/(crm)/communications/actions';
import { AutomationBuilderSelect } from '@/components/comms/automation-builder-select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { commsTabHref } from '@/lib/comms-channel';
import {
  WHATSAPP_TEMPLATE_CATEGORY_OPTIONS,
  WHATSAPP_TEMPLATE_LANGUAGE_OPTIONS,
  WHATSAPP_TEMPLATE_PURPOSE_OPTIONS,
  whatsAppTemplateStatusLabel,
  whatsAppTemplateStatusTone,
  type WhatsAppTemplateCategory,
  type WhatsAppTemplatePurpose,
} from '@/lib/whatsapp-template-types';
import type { WhatsAppTemplate } from '@/utils/api';

type WhatsAppTemplateEditorProps = {
  template?: WhatsAppTemplate | null;
  managementEnabled?: boolean;
};

function stringifyJson(value: unknown, fallback: string): string {
  try {
    return JSON.stringify(value ?? JSON.parse(fallback), null, 2);
  } catch {
    return fallback;
  }
}

function parseJsonField(raw: string, fallback: unknown): { value: unknown; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: fallback, error: null };
  }
  try {
    return { value: JSON.parse(trimmed) as unknown, error: null };
  } catch {
    return { value: fallback, error: 'Invalid JSON.' };
  }
}

export function WhatsAppTemplateEditor({ template = null, managementEnabled = true }: WhatsAppTemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? '');
  const [category, setCategory] = useState<WhatsAppTemplateCategory>(template?.category ?? 'marketing');
  const [language, setLanguage] = useState(template?.language ?? 'en');
  const [purpose, setPurpose] = useState<WhatsAppTemplatePurpose>(template?.purpose ?? 'individual');
  const [runtimeParamsJson, setRuntimeParamsJson] = useState(stringifyJson(template?.runtimeParams, '[]'));
  const [contentJson, setContentJson] = useState(stringifyJson(template?.content, '{}'));
  const [status, setStatus] = useState(template?.status ?? 'draft');
  const [testPhone, setTestPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const runtimeParams = parseJsonField(runtimeParamsJson, []);
      if (runtimeParams.error) {
        setError(`Runtime params: ${runtimeParams.error}`);
        return;
      }
      const content = parseJsonField(contentJson, {});
      if (content.error) {
        setError(`Content: ${content.error}`);
        return;
      }

      try {
        const saved = await saveWhatsAppTemplateAction(template?.id ?? null, {
          name: name.trim(),
          category,
          language,
          purpose,
          runtimeParams: runtimeParams.value,
          content: content.value,
        });
        setStatus(saved.status);
        setMessage('Template saved.');
        if (!template?.id) {
          router.replace(`/communications/whatsapp/templates/${saved.id}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template.');
      }
    });

  const runLifecycleAction = (action: 'submit' | 'activate' | 'deactivate') => {
    if (!template?.id) return;
    startTransition(async () => {
      setError(null);
      setMessage(null);
      try {
        const updated =
          action === 'submit'
            ? await submitWhatsAppTemplateAction(template.id)
            : action === 'activate'
              ? await activateWhatsAppTemplateAction(template.id)
              : await deactivateWhatsAppTemplateAction(template.id);
        setStatus(updated.status);
        setMessage(
          `Template ${action === 'submit' ? 'submitted' : action === 'activate' ? 'activated' : 'deactivated'}.`
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${action} template.`);
      }
    });
  };

  const sendTest = () => {
    if (!template?.id) return;
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const { error: sendError } = await sendWhatsAppTemplateTestAction(template.id, testPhone.trim());
      if (sendError) {
        setError(sendError);
        return;
      }
      setMessage('Test message sent.');
    });
  };

  const readOnly = !managementEnabled;

  return (
    <div className="flex flex-col gap-4">
      {readOnly ? (
        <p className="text-sm font-medium text-slate-600">
          Template management is disabled in this environment. You can view templates and send tests, but cannot edit or
          sync.
        </p>
      ) : null}
      <Card>
        <SectionHead
          title={template ? 'Edit WhatsApp template' : 'New WhatsApp template'}
          right={<Pill tone={whatsAppTemplateStatusTone(status)}>{whatsAppTemplateStatusLabel(status)}</Pill>}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <TextInput value={name} onChange={setName} placeholder="Template name" disabled={readOnly} />
          </Field>
          <Field label="Language">
            <AutomationBuilderSelect
              value={language}
              onChange={setLanguage}
              options={WHATSAPP_TEMPLATE_LANGUAGE_OPTIONS}
              disabled={readOnly}
            />
          </Field>
          <Field label="Category">
            <AutomationBuilderSelect
              value={category}
              onChange={(value) => setCategory(value as WhatsAppTemplateCategory)}
              options={WHATSAPP_TEMPLATE_CATEGORY_OPTIONS}
              disabled={readOnly}
            />
          </Field>
          <Field label="Purpose">
            <AutomationBuilderSelect
              value={purpose}
              onChange={(value) => setPurpose(value as WhatsAppTemplatePurpose)}
              options={WHATSAPP_TEMPLATE_PURPOSE_OPTIONS}
              disabled={readOnly}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Runtime params (JSON)">
            <Textarea
              value={runtimeParamsJson}
              onChange={(event) => setRuntimeParamsJson(event.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="[]"
              disabled={readOnly}
            />
          </Field>
          <Field label="Content (JSON)">
            <Textarea
              value={contentJson}
              onChange={(event) => setContentJson(event.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder="{}"
              disabled={readOnly}
            />
          </Field>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}
        {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {managementEnabled ? (
            <>
              <Button variant="primary" loading={isPending} loadingLabel="Saving…" onClick={save}>
                Save draft
              </Button>
              {template?.id ? (
                <>
                  {status === 'draft' || status === 'rejected' ? (
                    <Button variant="light" loading={isPending} onClick={() => runLifecycleAction('submit')}>
                      Submit for review
                    </Button>
                  ) : null}
                  {status === 'submitted' || status === 'paused' ? (
                    <Button variant="light" loading={isPending} onClick={() => runLifecycleAction('activate')}>
                      Activate
                    </Button>
                  ) : null}
                  {status === 'active' ? (
                    <Button variant="light" loading={isPending} onClick={() => runLifecycleAction('deactivate')}>
                      Deactivate
                    </Button>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          <Button variant="light" onClick={() => router.push(commsTabHref('whatsapp', 'templates'))}>
            Back to templates
          </Button>
        </div>
      </Card>

      {template?.id ? (
        <Card>
          <SectionHead title="Send test" subtitle="Send this template to a phone number for testing." />
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Phone (E.164)" className="min-w-[220px] flex-1">
              <TextInput value={testPhone} onChange={setTestPhone} placeholder="+919876543210" />
            </Field>
            <Button
              variant="primary"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              loading={isPending}
              loadingLabel="Sending…"
              disabled={!testPhone.trim()}
              onClick={sendTest}
            >
              Send test
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
