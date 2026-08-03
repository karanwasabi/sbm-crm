'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { archiveIntakeFormAction, saveIntakeForm } from '@/app/(crm)/leads/actions';
import { LeadTagEditor, TagChip } from '@/components/leads/lead-tag-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { previewIntakeFormTag, tagSlugToLabel } from '@/lib/lead-tags';
import type { IntakeForm, TagSuggestion } from '@/types/crm';

type IntakeFormsTabProps = {
  forms: IntakeForm[];
  tagSuggestions: TagSuggestion[];
  initialFormId?: string;
  currentUserId?: string;
  isMarketing?: boolean;
};

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

const EMPTY_DRAFT = {
  name: '',
  title: '',
  description: '',
  extraTags: [] as string[],
  showCountry: false,
  showCity: false,
  showNotes: false,
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function IntakeFormsTab({
  forms,
  tagSuggestions,
  initialFormId,
  currentUserId = '',
  isMarketing = false,
}: IntakeFormsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [view, setView] = useState<ViewMode>(initialFormId ? 'detail' : 'list');
  const [selectedId, setSelectedId] = useState<string | null>(initialFormId ?? null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [tagError, setTagError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredForms = useMemo(() => {
    if (statusFilter === 'all') return forms;
    return forms.filter((form) => form.status === statusFilter);
  }, [forms, statusFilter]);

  const selectedForm = useMemo(() => forms.find((form) => form.id === selectedId) ?? null, [forms, selectedId]);

  const canManageForm = (form: IntakeForm) =>
    !isMarketing || (form.createdBy != null && form.createdBy === currentUserId);

  const previewFormTag = useMemo(() => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) return null;

    if (view === 'edit' && selectedForm && trimmedName === selectedForm.name.trim()) {
      return selectedForm.formTag;
    }

    return previewIntakeFormTag(trimmedName, forms, view === 'edit' ? selectedId : null);
  }, [draft.name, forms, selectedForm, selectedId, view]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setTagError(null);
    setSelectedId(null);
    setView('create');
  };

  const openEdit = (form: IntakeForm) => {
    if (!canManageForm(form)) return;
    setDraft({
      name: form.name,
      title: form.title,
      description: form.description ?? '',
      extraTags: form.extraTags,
      showCountry: form.showCountry,
      showCity: form.showCity,
      showNotes: form.showNotes,
    });
    setSelectedId(form.id);
    setError(null);
    setTagError(null);
    setView('edit');
  };

  const openDetail = (form: IntakeForm) => {
    setSelectedId(form.id);
    setView('detail');
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      setError('Form name is required.');
      return;
    }
    if (!draft.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (tagError) {
      setError(tagError);
      return;
    }

    startTransition(async () => {
      const result = await saveIntakeForm(
        {
          name: draft.name.trim(),
          title: draft.title.trim(),
          ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
          extra_tags: draft.extraTags,
          show_country: draft.showCountry,
          show_city: draft.showCity,
          show_notes: draft.showNotes,
        },
        view === 'edit' ? (selectedId ?? undefined) : undefined
      );
      if (result.error || !result.form) {
        setError(result.error ?? 'Failed to save form.');
        toast({ message: result.error ?? 'Failed to save form.', variant: 'error' });
        return;
      }
      toast({ message: view === 'edit' ? 'Form updated' : 'Form created', variant: 'success' });
      setSelectedId(result.form.id);
      setView('detail');
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!selectedForm || !canManageForm(selectedForm)) return;
    startTransition(async () => {
      const result = await archiveIntakeFormAction(selectedForm.id);
      if (result.error) {
        toast({ message: result.error, variant: 'error' });
        return;
      }
      toast({ message: 'Form archived', variant: 'success' });
      setView('list');
      setSelectedId(null);
      router.refresh();
    });
  };

  const copyPublicUrl = async () => {
    if (!selectedForm) return;
    try {
      await navigator.clipboard.writeText(selectedForm.publicUrl);
      toast({ message: 'Public link copied', variant: 'success' });
    } catch {
      toast({ message: 'Could not copy link', variant: 'error' });
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <Card className="max-w-3xl">
        <SectionHead title={view === 'create' ? 'Create intake form' : 'Edit intake form'} />
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Form name">
              <TextInput
                value={draft.name}
                onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                placeholder="e.g. Summer workshop Q2"
                disabled={pending}
              />
            </Field>
            <Field label="Form tag">
              <div className="flex min-h-10 items-center">
                {previewFormTag ? (
                  <TagChip label={tagSlugToLabel(previewFormTag)} locked />
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </div>
            </Field>
          </div>
          <Field label="Title">
            <TextInput
              value={draft.title}
              onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
              placeholder="e.g. Register your interest"
              disabled={pending}
            />
          </Field>
          <Field label="Description" hint="Optional. Shown on the public form.">
            <Textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              disabled={pending}
            />
          </Field>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <p className="text-[12px] font-bold text-slate-700">Fields on the public form</p>
            <div className="mt-3 flex flex-col gap-2">
              {['First name', 'Last name', 'Email', 'Phone'].map((label) => (
                <Checkbox key={label} checked disabled onChange={() => {}} label={`${label} (required)`} />
              ))}
              <Checkbox
                checked={draft.showCountry}
                onChange={(checked) => setDraft((current) => ({ ...current, showCountry: checked }))}
                disabled={pending}
                label="Country"
              />
              <Checkbox
                checked={draft.showCity}
                onChange={(checked) => setDraft((current) => ({ ...current, showCity: checked }))}
                disabled={pending}
                label="City"
              />
              <Checkbox
                checked={draft.showNotes}
                onChange={(checked) => setDraft((current) => ({ ...current, showNotes: checked }))}
                disabled={pending}
                label="Notes"
              />
            </div>
          </div>

          <Field
            label="Extra tags"
            hint="Optional. Applied in addition to the form tag above."
            error={tagError}
            className="overflow-visible"
          >
            <LeadTagEditor
              bordered
              manualTags={draft.extraTags}
              suggestions={tagSuggestions}
              disabled={pending}
              onError={setTagError}
              onManualTagsChange={(extraTags) => setDraft((current) => ({ ...current, extraTags }))}
            />
          </Field>

          {error ? <p className="text-sm font-medium text-danger-press">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setView('list')} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} loading={pending} loadingLabel="Saving…">
              {view === 'create' ? 'Create form' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (view === 'detail' && selectedForm) {
    return (
      <Card className="max-w-3xl">
        <SectionHead title={selectedForm.name} subtitle={`Status: ${selectedForm.status}`} />
        <div className="flex flex-col gap-3">
          {selectedForm.description ? <p className="text-sm text-slate-600">{selectedForm.description}</p> : null}
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold text-slate-500">Title</dt>
            <dd className="text-slate-800">{selectedForm.title}</dd>
            <dt className="font-semibold text-slate-500">Form tag</dt>
            <dd className="text-slate-800">{tagSlugToLabel(selectedForm.formTag)}</dd>
            <dt className="font-semibold text-slate-500">Public URL</dt>
            <dd className="break-all text-slate-800">{selectedForm.publicUrl}</dd>
            <dt className="font-semibold text-slate-500">Optional fields</dt>
            <dd className="text-slate-800">
              {[
                selectedForm.showCountry && 'Country',
                selectedForm.showCity && 'City',
                selectedForm.showNotes && 'Notes',
              ]
                .filter(Boolean)
                .join(', ') || 'None'}
            </dd>
            <dt className="font-semibold text-slate-500">Created</dt>
            <dd className="text-slate-800">{formatDate(selectedForm.createdAt)}</dd>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="primary" onClick={copyPublicUrl}>
              Copy public link
            </Button>
            {selectedForm.status === 'active' && canManageForm(selectedForm) ? (
              <>
                <Button type="button" variant="ghost" onClick={() => openEdit(selectedForm)} disabled={pending}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" onClick={handleArchive} disabled={pending}>
                  Archive
                </Button>
              </>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setView('list')}>
              Back to list
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <SectionHead
        title="Intake forms"
        subtitle="Public forms at forms.slowburnmethod.in · leads tagged automatically"
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1">
          {(['active', 'archived', 'all'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`cursor-pointer rounded-[14px] px-3 py-1.5 text-[12px] font-semibold capitalize ${
                statusFilter === filter ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          Create form
        </Button>
      </div>

      {filteredForms.length === 0 ? (
        <p className="text-sm text-slate-500">No intake forms yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Tag</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map((form) => (
                <tr
                  key={form.id}
                  className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/80"
                  onClick={() => openDetail(form)}
                >
                  <td className="py-3 pr-4 font-semibold text-slate-800">{form.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{tagSlugToLabel(form.formTag)}</td>
                  <td className="py-3 pr-4 text-slate-600 capitalize">{form.status}</td>
                  <td className="py-3 text-slate-500">{formatDate(form.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
