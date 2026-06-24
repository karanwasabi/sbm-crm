'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { compileEmailTemplate } from '@/lib/email-template-render';
import {
  EMAIL_LAYOUT_OPTIONS,
  EMAIL_VARIABLES,
  type EmailBlock,
  type EmailTemplateClassification,
  type EmailTemplateLayout,
} from '@/lib/email-template-types';
import { cn } from '@/lib/cn';
import { saveEmailTemplateAction, sendEmailTemplateTestAction } from '@/app/(crm)/communications/actions';
import type { EmailTemplate } from '@/utils/api';

type TemplateEditorFormProps = {
  template?: EmailTemplate;
  staffEmail?: string;
};

const DEFAULT_BLOCKS: EmailBlock[] = [
  { type: 'heading', text: 'Hi {{lead.first_name}},' },
  { type: 'paragraph', text: 'We wanted to follow up about your interest in {{lead.program_interest}}.' },
  { type: 'button', text: 'Visit the portal', url: '{{links.portal}}' },
];

export function TemplateEditorForm({ template, staffEmail }: TemplateEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState(template?.name ?? 'New email template');
  const [classification, setClassification] = useState<EmailTemplateClassification>(
    template?.classification ?? 'marketing'
  );
  const [layout, setLayout] = useState<EmailTemplateLayout>(template?.layout ?? 'simple');
  const [subject, setSubject] = useState(template?.subject ?? 'A quick note from SBM');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(template?.status ?? 'draft');
  const [blocks, setBlocks] = useState<EmailBlock[]>(
    template?.contentJson?.length ? template.contentJson : DEFAULT_BLOCKS
  );
  const [testEmail, setTestEmail] = useState(staffEmail ?? '');

  const compiled = useMemo(
    () => compileEmailTemplate({ layout, classification, subject, blocks }),
    [layout, classification, subject, blocks]
  );

  function insertVariable(token: string, target: 'subject' | number) {
    if (target === 'subject') {
      setSubject((value) => `${value}${value.endsWith(' ') || value.length === 0 ? '' : ' '}${token}`);
      return;
    }
    setBlocks((current) =>
      current.map((block, index) => {
        if (index !== target) return block;
        if (block.type === 'heading' || block.type === 'paragraph') {
          return {
            ...block,
            text: `${block.text}${block.text.endsWith(' ') || block.text.length === 0 ? '' : ' '}${token}`,
          };
        }
        if (block.type === 'button') {
          return {
            ...block,
            url: `${block.url}${block.url.endsWith(' ') || block.url.length === 0 ? '' : ' '}${token}`,
          };
        }
        return block;
      })
    );
  }

  function updateBlock(index: number, block: EmailBlock) {
    setBlocks((current) => current.map((item, i) => (i === index ? block : item)));
  }

  function addBlock(type: EmailBlock['type']) {
    const next: EmailBlock =
      type === 'heading'
        ? { type: 'heading', text: 'Section title' }
        : type === 'paragraph'
          ? { type: 'paragraph', text: 'Write your message here.' }
          : type === 'button'
            ? { type: 'button', text: 'Take action', url: '{{links.portal}}' }
            : type === 'image'
              ? { type: 'image', src: 'https://placehold.co/600x240', alt: 'SBM' }
              : { type: 'divider' };
    setBlocks((current) => [...current, next]);
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const payload = {
          name,
          classification,
          layout,
          subject,
          contentJson: blocks,
          htmlCompiled: compiled.html,
          textCompiled: compiled.text,
          status,
        };
        if (template) {
          await saveEmailTemplateAction(template.id, payload);
          setMessage('Template saved.');
          router.refresh();
        } else {
          const created = await saveEmailTemplateAction(null, payload);
          router.replace(`/communications/templates/${created.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template.');
      }
    });
  }

  function sendTest() {
    if (!template) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await saveEmailTemplateAction(template.id, {
          name,
          classification,
          layout,
          subject,
          contentJson: blocks,
          htmlCompiled: compiled.html,
          textCompiled: compiled.text,
          status,
        });
        await sendEmailTemplateTestAction(template.id, testEmail);
        setMessage(`Test email sent to ${testEmail}.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send test email.');
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col gap-4">
        <Card>
          <SectionHead title="Template details" subtitle="Name, classification, and publish status" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              Name
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              Status
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['marketing', 'transactional'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setClassification(value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-bold capitalize',
                  classification === value ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead title="Layout" subtitle="Choose a structure for this email" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {EMAIL_LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLayout(option.id)}
                className={cn(
                  'rounded-2xl border px-3 py-3 text-left transition',
                  layout === option.id ? 'border-brand bg-brand/5' : 'border-slate-100 bg-canvas-cool'
                )}
              >
                <p className="text-sm font-bold text-slate-800">{option.label}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{option.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead title="Content" subtitle="Subject, blocks, and variables" />
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            Subject
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EMAIL_VARIABLES.map((variable) => (
              <button
                key={variable.token}
                type="button"
                onClick={() => insertVariable(variable.token, 'subject')}
                className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
              >
                {variable.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {blocks.map((block, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-canvas-cool p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">{block.type}</span>
                  <button
                    type="button"
                    onClick={() => setBlocks((current) => current.filter((_, i) => i !== index))}
                    className="text-slate-400 hover:text-danger-press"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {block.type === 'heading' || block.type === 'paragraph' ? (
                  <textarea
                    className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                    value={block.text}
                    onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                  />
                ) : null}
                {block.type === 'button' ? (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      value={block.text}
                      onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                      placeholder="Button label"
                    />
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      value={block.url}
                      onChange={(e) => updateBlock(index, { ...block, url: e.target.value })}
                      placeholder="Button URL"
                    />
                  </div>
                ) : null}
                {block.type === 'image' ? (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      value={block.src}
                      onChange={(e) => updateBlock(index, { ...block, src: e.target.value })}
                      placeholder="Image URL"
                    />
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      value={block.alt}
                      onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                      placeholder="Alt text"
                    />
                  </div>
                ) : null}
                {block.type !== 'divider' ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {EMAIL_VARIABLES.map((variable) => (
                      <button
                        key={variable.token}
                        type="button"
                        onClick={() => insertVariable(variable.token, index)}
                        className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600"
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="light"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => addBlock('paragraph')}
            >
              Paragraph
            </Button>
            <Button variant="light" size="sm" onClick={() => addBlock('heading')}>
              Heading
            </Button>
            <Button variant="light" size="sm" onClick={() => addBlock('button')}>
              Button
            </Button>
            <Button variant="light" size="sm" onClick={() => addBlock('divider')}>
              Divider
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={save} disabled={isPending}>
            {template ? 'Save template' : 'Create template'}
          </Button>
          {template ? (
            <>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Test email address"
              />
              <Button
                variant="light"
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={sendTest}
                disabled={isPending || !testEmail}
              >
                Send test
              </Button>
            </>
          ) : null}
        </div>
        {error ? <p className="text-sm font-medium text-danger-press">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-success-press">{message}</p> : null}
      </div>

      <Card className="h-fit xl:sticky xl:top-4">
        <SectionHead title="Preview" subtitle="Sample data substituted" />
        <p className="mb-3 text-sm font-bold text-slate-800">{compiled.subject}</p>
        <div
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
          dangerouslySetInnerHTML={{ __html: compiled.html }}
        />
      </Card>
    </div>
  );
}
