'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  activateWhatsAppTemplateAction,
  deactivateWhatsAppTemplateAction,
  saveWhatsAppTemplateAction,
  sendWhatsAppTemplateTestAction,
  submitWhatsAppTemplateAction,
} from '@/app/(crm)/communications/actions';
import { AutomationBuilderSelect } from '@/components/comms/automation-builder-select';
import { WhatsAppTemplatePreview } from '@/components/comms/whatsapp-template-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { commsTabHref } from '@/lib/comms-channel';
import {
  WHATSAPP_INSERT_VARIABLE_OPTIONS,
  WHATSAPP_LEAD_FIELD_OPTIONS,
  buildWhatsAppRuntimeParams,
  buildWhatsAppTemplateContent,
  mergeVariablesFromText,
  newWhatsAppButtonId,
  parseWhatsAppTemplateContent,
  validateWhatsAppTemplateForm,
  type WhatsAppButtonType,
  type WhatsAppHeaderFormat,
  type WhatsAppTemplateButton,
  type WhatsAppTemplateFormContent,
} from '@/lib/whatsapp-template-content';
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

const HEADER_OPTIONS: { value: WhatsAppHeaderFormat; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'text', label: 'Text' },
];

const BUTTON_TYPE_OPTIONS: { value: WhatsAppButtonType; label: string }[] = [
  { value: 'url', label: 'Visit website' },
  { value: 'quick_reply', label: 'Quick reply' },
  { value: 'phone', label: 'Call phone number' },
];

function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  token: string,
  current: string,
  onChange: (value: string) => void
) {
  if (!textarea) {
    onChange(`${current}${token}`);
    return;
  }
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? current.length;
  const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const caret = start + token.length;
    textarea.setSelectionRange(caret, caret);
  });
}

export function WhatsAppTemplateEditor({ template = null, managementEnabled = true }: WhatsAppTemplateEditorProps) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const [name, setName] = useState(template?.name ?? '');
  const [category, setCategory] = useState<WhatsAppTemplateCategory>(template?.category ?? 'marketing');
  const [language, setLanguage] = useState(template?.language ?? 'en');
  const [purpose, setPurpose] = useState<WhatsAppTemplatePurpose>(template?.purpose ?? 'individual');
  const [form, setForm] = useState<WhatsAppTemplateFormContent>(() =>
    parseWhatsAppTemplateContent(template?.content, template?.runtimeParams)
  );
  const [status, setStatus] = useState(template?.status ?? 'draft');
  const [testPhone, setTestPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const readOnly = !managementEnabled;
  const canEditContent = !readOnly && (status === 'draft' || status === 'rejected');

  const advancedJson = useMemo(
    () =>
      JSON.stringify(
        {
          runtime_params: buildWhatsAppRuntimeParams(form),
          content: buildWhatsAppTemplateContent(form),
        },
        null,
        2
      ),
    [form]
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      variables: mergeVariablesFromText(current.body, current.variables),
    }));
  }, [form.body]);

  const updateForm = (patch: Partial<WhatsAppTemplateFormContent>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const updateVariable = (index: number, patch: Partial<WhatsAppTemplateFormContent['variables'][number]>) => {
    setForm((current) => ({
      ...current,
      variables: current.variables.map((variable, i) => (i === index ? { ...variable, ...patch } : variable)),
    }));
  };

  const addButton = () => {
    if (form.buttons.length >= 3) return;
    updateForm({
      buttons: [
        ...form.buttons,
        {
          id: newWhatsAppButtonId(),
          type: 'url',
          text: '',
          url: '',
        },
      ],
    });
  };

  const updateButton = (id: string, patch: Partial<WhatsAppTemplateButton>) => {
    updateForm({
      buttons: form.buttons.map((button) => (button.id === id ? { ...button, ...patch } : button)),
    });
  };

  const removeButton = (id: string) => {
    updateForm({ buttons: form.buttons.filter((button) => button.id !== id) });
  };

  const save = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);

      if (!name.trim()) {
        setError('Template name is required.');
        return;
      }

      const validationError = validateWhatsAppTemplateForm(form);
      if (validationError) {
        setError(validationError);
        return;
      }

      const content = buildWhatsAppTemplateContent(form);
      const runtimeParams = buildWhatsAppRuntimeParams(form);

      try {
        const saved = await saveWhatsAppTemplateAction(template?.id ?? null, {
          name: name.trim(),
          category,
          language,
          purpose,
          runtimeParams,
          content,
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
        if (action === 'submit') {
          const result = await submitWhatsAppTemplateAction(template.id);
          if (result.error) {
            setError(result.error);
            return;
          }
          if (!result.template) {
            setError('Failed to submit template.');
            return;
          }
          setStatus(result.template.status);
          setMessage('Template submitted.');
        } else {
          const updated =
            action === 'activate'
              ? await activateWhatsAppTemplateAction(template.id)
              : await deactivateWhatsAppTemplateAction(template.id);
          setStatus(updated.status);
          setMessage(`Template ${action === 'activate' ? 'activated' : 'deactivated'}.`);
        }
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

  return (
    <div className="flex flex-col gap-4">
      {readOnly ? (
        <p className="text-sm font-medium text-slate-600">
          Template management is disabled in this environment. You can view templates and send tests, but cannot edit or
          sync.
        </p>
      ) : null}

      {!canEditContent && !readOnly ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This template is <strong>{whatsAppTemplateStatusLabel(status)}</strong>. Message content is read-only here.
          Deactivate the template in Convonite to edit, or duplicate it as a new draft.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <SectionHead
            title={template ? 'Edit template' : 'New template'}
            subtitle="Build your WhatsApp message — we handle the technical format behind the scenes."
            right={<Pill tone={whatsAppTemplateStatusTone(status)}>{whatsAppTemplateStatusLabel(status)}</Pill>}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Template name">
              <TextInput value={name} onChange={setName} placeholder="e.g. join_th_group" disabled={readOnly} />
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

          <div className="mt-5 space-y-5">
            <Field label="Description" hint="Optional internal note — not sent to recipients.">
              <TextInput
                value={form.description}
                onChange={(value) => updateForm({ description: value })}
                placeholder="What is this template for?"
                disabled={!canEditContent}
              />
            </Field>

            <Field label="Header">
              <AutomationBuilderSelect
                value={form.headerFormat}
                onChange={(value) =>
                  updateForm({
                    headerFormat: value as WhatsAppHeaderFormat,
                    headerText: value === 'none' ? '' : form.headerText,
                  })
                }
                options={HEADER_OPTIONS}
                disabled={!canEditContent}
              />
            </Field>

            {form.headerFormat === 'text' ? (
              <Field label="Header text">
                <TextInput
                  value={form.headerText}
                  onChange={(value) => updateForm({ headerText: value })}
                  placeholder="Short title above the message"
                  disabled={!canEditContent}
                />
              </Field>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">Body</p>
                </div>
                <Textarea
                  ref={bodyRef}
                  value={form.body}
                  onChange={(event) => updateForm({ body: event.target.value })}
                  rows={10}
                  placeholder={'Hello {{first_name}},\n\nThank you for registering…'}
                  disabled={!canEditContent}
                />
                {canEditContent ? (
                  <div className="flex flex-wrap gap-2">
                    {WHATSAPP_INSERT_VARIABLE_OPTIONS.map((option) => (
                      <button
                        key={option.token}
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand"
                        onClick={() =>
                          insertAtCursor(bodyRef.current, option.token, form.body, (body) => updateForm({ body }))
                        }
                      >
                        + {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-slate-500">
                  Use {'{{variable_name}}'} for personalization. We detect variables automatically.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">Variable samples</p>
                <p className="mt-1 text-xs text-slate-500">
                  For custom variables, the sample is the default send value. For lead fields it is used for Meta
                  approval and preview.
                </p>
                <div className="mt-3 space-y-3">
                  {form.variables.length === 0 ? (
                    <p className="text-sm text-slate-500">No variables yet.</p>
                  ) : (
                    form.variables.map((variable, index) => (
                      <div key={variable.name} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-800">{`{{${variable.name}}}`}</p>
                        <Field label="Sample / default value">
                          <TextInput
                            value={variable.example}
                            onChange={(value) => updateVariable(index, { example: value })}
                            placeholder="e.g. Alex"
                            disabled={!canEditContent}
                          />
                        </Field>
                        <Field label="Maps to lead field">
                          <AutomationBuilderSelect
                            value={variable.leadField}
                            onChange={(value) =>
                              updateVariable(index, {
                                leadField: value as WhatsAppTemplateFormContent['variables'][number]['leadField'],
                              })
                            }
                            options={WHATSAPP_LEAD_FIELD_OPTIONS}
                            disabled={!canEditContent}
                          />
                        </Field>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Field label="Footer" hint="Small grey text at the bottom of the message.">
              <TextInput
                value={form.footer}
                onChange={(value) => updateForm({ footer: value })}
                placeholder="Optional footer"
                disabled={!canEditContent}
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">Buttons</p>
                  <p className="text-xs text-slate-500">Optional. Up to 3 buttons per template.</p>
                </div>
                {canEditContent && form.buttons.length < 3 ? (
                  <Button variant="light" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addButton}>
                    Add button
                  </Button>
                ) : null}
              </div>

              {form.buttons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No buttons yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.buttons.map((button) => (
                    <div key={button.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">Button</p>
                        {canEditContent ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-danger-press"
                            onClick={() => removeButton(button.id)}
                            aria-label="Remove button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Type">
                          <AutomationBuilderSelect
                            value={button.type}
                            onChange={(value) => updateButton(button.id, { type: value as WhatsAppButtonType })}
                            options={BUTTON_TYPE_OPTIONS}
                            disabled={!canEditContent}
                          />
                        </Field>
                        <Field label="Label">
                          <TextInput
                            value={button.text}
                            onChange={(value) => updateButton(button.id, { text: value })}
                            placeholder="Button text"
                            disabled={!canEditContent}
                          />
                        </Field>
                        {button.type === 'url' ? (
                          <Field label="URL" className="md:col-span-2">
                            <TextInput
                              value={button.url ?? ''}
                              onChange={(value) => updateButton(button.id, { url: value })}
                              placeholder="https://slowburnmethod.in"
                              disabled={!canEditContent}
                            />
                          </Field>
                        ) : null}
                        {button.type === 'phone' ? (
                          <Field label="Phone number" className="md:col-span-2">
                            <TextInput
                              value={button.phone ?? ''}
                              onChange={(value) => updateButton(button.id, { phone: value })}
                              placeholder="+919876543210"
                              disabled={!canEditContent}
                            />
                          </Field>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-danger-press">{error}</p> : null}
          {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {managementEnabled ? (
              <>
                <Button variant="primary" loading={isPending} loadingLabel="Saving…" onClick={save} disabled={readOnly}>
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

          <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-600">Show advanced JSON</summary>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700">{advancedJson}</pre>
          </details>
        </Card>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card>
            <WhatsAppTemplatePreview form={form} />
          </Card>
        </div>
      </div>

      {template?.id ? (
        <Card>
          <SectionHead title="Send test" subtitle="Send this template to a phone number for testing." />
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Phone (E.164)" className="min-w-[220px] flex-1">
              <TextInput value={testPhone} onChange={setTestPhone} placeholder="+919876543210" />
            </Field>
            <Button
              variant="primary"
              leftIcon={<WhatsAppIcon />}
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
