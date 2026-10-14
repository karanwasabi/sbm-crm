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
import type { IntakeForm, IntakeFormField, TagSuggestion } from '@/types/crm';

type IntakeFormsTabProps = {
  forms: IntakeForm[];
  tagSuggestions: TagSuggestion[];
  initialFormId?: string;
  currentUserId?: string;
  isMarketing?: boolean;
};

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

/** Editable option; tags are kept as raw comma-separated text and split on save. */
type DraftOption = {
  value: string;
  label: string;
  tagsText: string;
};

/**
 * Editable form of IntakeFormField. `key` is a stable client-only React key and
 * `idEdited` stops the auto-slug once the user types in the id box.
 */
type DraftField = {
  key: string;
  id: string;
  idEdited: boolean;
  label: string;
  required: boolean;
  options: DraftOption[];
};

type Draft = {
  name: string;
  title: string;
  description: string;
  extraTags: string[];
  showCountry: boolean;
  showCity: boolean;
  showNotes: boolean;
  fields: DraftField[];
  thankYouTitle: string;
  thankYouBody: string;
};

const FIELD_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const MIN_OPTIONS = 2;

const EMPTY_DRAFT: Draft = {
  name: '',
  title: '',
  description: '',
  extraTags: [] as string[],
  showCountry: false,
  showCity: false,
  showNotes: false,
  fields: [],
  thankYouTitle: '',
  thankYouBody: '',
};

let draftFieldCounter = 0;
function nextDraftFieldKey() {
  draftFieldCounter += 1;
  return `field-${draftFieldCounter}`;
}

function emptyDraftOption(): DraftOption {
  return { value: '', label: '', tagsText: '' };
}

function newDraftField(): DraftField {
  return {
    key: nextDraftFieldKey(),
    id: '',
    idEdited: false,
    label: '',
    required: false,
    options: [emptyDraftOption(), emptyDraftOption()],
  };
}

function toDraftFields(fields: IntakeFormField[]): DraftField[] {
  return fields.map((field) => ({
    key: nextDraftFieldKey(),
    id: field.id,
    idEdited: true,
    label: field.label,
    required: field.required,
    options: field.options.map((option) => ({
      value: option.value,
      label: option.label,
      tagsText: (option.tags ?? []).join(', '),
    })),
  }));
}

function parseTagsText(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of text.split(',')) {
    const tag = part.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

/** Makes an id matching [a-z][a-z0-9_]{0,63} from a label (empty string if nothing usable). */
export function slugifyFieldId(label: string): string {
  let slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '');
  if (!slug) return '';
  if (!/^[a-z]/.test(slug)) slug = `q_${slug}`;
  return slug.slice(0, 64).replace(/_+$/, '');
}

/** Lenient sanitiser for manual id typing (keeps trailing underscores so "a_b" can be typed). */
function sanitizeFieldIdInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 64);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Returns an error message, or null when the custom fields are valid. */
function validateDraftFields(fields: DraftField[]): string | null {
  const seenIds = new Set<string>();
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]!;
    const position = `Custom question ${index + 1}`;
    if (!field.label.trim()) return `${position}: label is required.`;
    if (!FIELD_ID_PATTERN.test(field.id)) {
      return `${position}: field id must start with a letter and use only a-z, 0-9 and _ (max 64 characters).`;
    }
    if (seenIds.has(field.id)) return `${position}: field id "${field.id}" is used more than once.`;
    seenIds.add(field.id);
    if (field.options.length < MIN_OPTIONS) return `${position}: add at least ${MIN_OPTIONS} options.`;
    const seenValues = new Set<string>();
    for (let optionIndex = 0; optionIndex < field.options.length; optionIndex += 1) {
      const option = field.options[optionIndex]!;
      const optionPosition = `${position}, option ${optionIndex + 1}`;
      const value = option.value.trim();
      if (!value) return `${optionPosition}: value is required.`;
      if (!FIELD_ID_PATTERN.test(value)) {
        return `${optionPosition}: value must start with a letter and use only a-z, 0-9 and _ (max 64 characters).`;
      }
      if (!option.label.trim()) return `${optionPosition}: label is required.`;
      if (seenValues.has(value)) return `${position}: option value "${value}" is used more than once.`;
      seenValues.add(value);
    }
  }
  return null;
}

function toApiFields(fields: DraftField[]): IntakeFormField[] {
  return fields.map((field) => ({
    id: field.id,
    type: 'radio' as const,
    label: field.label.trim(),
    required: field.required,
    options: field.options.map((option) => {
      const tags = parseTagsText(option.tagsText);
      return {
        value: option.value.trim(),
        label: option.label.trim(),
        ...(tags.length > 0 ? { tags } : {}),
      };
    }),
  }));
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
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [tagError, setTagError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredForms = useMemo(() => {
    if (statusFilter === 'all') return forms;
    return forms.filter((form) => form.status === statusFilter);
  }, [forms, statusFilter]);

  const selectedForm = useMemo(() => forms.find((form) => form.id === selectedId) ?? null, [forms, selectedId]);

  /** Field ids already saved on the form; these cannot be renamed while editing. */
  const lockedIds = useMemo(
    () => new Set(view === 'edit' && selectedForm ? selectedForm.fields.map((field) => field.id) : []),
    [view, selectedForm]
  );

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

  const thankYouParagraphs = useMemo(() => splitParagraphs(draft.thankYouBody), [draft.thankYouBody]);

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
      fields: toDraftFields(form.fields),
      thankYouTitle: form.thankYouTitle ?? '',
      thankYouBody: form.thankYouBody ?? '',
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

  const updateField = (key: string, updater: (field: DraftField) => DraftField) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.key === key ? updater(field) : field)),
    }));
  };

  const addField = () => {
    setDraft((current) => ({ ...current, fields: [...current.fields, newDraftField()] }));
  };

  const removeField = (key: string) => {
    setDraft((current) => ({ ...current, fields: current.fields.filter((field) => field.key !== key) }));
  };

  const updateFieldLabel = (key: string, label: string) => {
    updateField(key, (field) => {
      const locked = lockedIds.has(field.id);
      return {
        ...field,
        label,
        id: locked || field.idEdited ? field.id : slugifyFieldId(label),
      };
    });
  };

  const updateFieldId = (key: string, value: string) => {
    updateField(key, (field) => {
      if (lockedIds.has(field.id)) return field;
      const id = sanitizeFieldIdInput(value);
      // Clearing the box hands control back to the label-based auto-slug.
      return { ...field, id, idEdited: id !== '' };
    });
  };

  const updateOption = (key: string, optionIndex: number, patch: Partial<DraftOption>) => {
    updateField(key, (field) => ({
      ...field,
      options: field.options.map((option, index) => {
        if (index !== optionIndex) return option;
        const next = { ...option, ...patch };
        if (patch.value !== undefined) {
          next.value = sanitizeFieldIdInput(patch.value);
        } else if (patch.label !== undefined && !option.value) {
          next.value = slugifyFieldId(patch.label);
        }
        return next;
      }),
    }));
  };

  const addOption = (key: string) => {
    updateField(key, (field) => ({ ...field, options: [...field.options, emptyDraftOption()] }));
  };

  const removeOption = (key: string, optionIndex: number) => {
    updateField(key, (field) =>
      field.options.length <= MIN_OPTIONS
        ? field
        : { ...field, options: field.options.filter((_, index) => index !== optionIndex) }
    );
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
    const fieldsError = validateDraftFields(draft.fields);
    if (fieldsError) {
      setError(fieldsError);
      return;
    }
    setError(null);

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
          fields: toApiFields(draft.fields),
          thank_you_title: draft.thankYouTitle.trim(),
          thank_you_body: draft.thankYouBody.trim(),
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

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-bold text-slate-700">Custom questions</p>
                <p className="text-[11.5px] font-medium text-slate-500">
                  Radio questions shown after the core fields. Option tags are applied to the lead.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={addField} disabled={pending}>
                Add radio field
              </Button>
            </div>

            {draft.fields.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No custom questions.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {draft.fields.map((field, fieldIndex) => {
                  const idLocked = lockedIds.has(field.id);
                  return (
                    <div key={field.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-slate-700">Question {fieldIndex + 1}</p>
                        <Button type="button" variant="ghost" onClick={() => removeField(field.key)} disabled={pending}>
                          Remove field
                        </Button>
                      </div>

                      <div className="mt-2 flex flex-col gap-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Label">
                            <TextInput
                              value={field.label}
                              onChange={(value) => updateFieldLabel(field.key, value)}
                              placeholder="e.g. How did you hear about us?"
                              disabled={pending}
                            />
                          </Field>
                          <Field
                            label="Field id"
                            hint={
                              idLocked
                                ? 'Locked: this id was already saved on the form.'
                                : 'Lowercase letters, numbers and _. Auto-filled from the label.'
                            }
                          >
                            <TextInput
                              value={field.id}
                              onChange={(value) => updateFieldId(field.key, value)}
                              placeholder="e.g. heard_about_us"
                              disabled={pending || idLocked}
                              maxLength={64}
                            />
                          </Field>
                        </div>

                        <Checkbox
                          checked={field.required}
                          onChange={(checked) =>
                            updateField(field.key, (current) => ({ ...current, required: checked }))
                          }
                          disabled={pending}
                          label="Required"
                        />

                        <div className="flex flex-col gap-2">
                          <p className="pl-0.5 text-[12.5px] font-semibold text-slate-700">Options</p>
                          {field.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto]"
                            >
                              <TextInput
                                value={option.value}
                                onChange={(value) => updateOption(field.key, optionIndex, { value })}
                                placeholder="Value"
                                aria-label={`Option ${optionIndex + 1} value`}
                                disabled={pending}
                              />
                              <TextInput
                                value={option.label}
                                onChange={(value) => updateOption(field.key, optionIndex, { label: value })}
                                placeholder="Label"
                                aria-label={`Option ${optionIndex + 1} label`}
                                disabled={pending}
                              />
                              <TextInput
                                value={option.tagsText}
                                onChange={(value) => updateOption(field.key, optionIndex, { tagsText: value })}
                                placeholder="Tags (comma-separated)"
                                aria-label={`Option ${optionIndex + 1} tags`}
                                disabled={pending}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeOption(field.key, optionIndex)}
                                disabled={pending || field.options.length <= MIN_OPTIONS}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addOption(field.key)}
                              disabled={pending}
                            >
                              Add option
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <p className="text-[12px] font-bold text-slate-700">Thank-you message</p>
            <div className="mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3.5">
                <Field label="Thank-you title" hint="Optional. Shown after the form is submitted.">
                  <TextInput
                    value={draft.thankYouTitle}
                    onChange={(value) => setDraft((current) => ({ ...current, thankYouTitle: value }))}
                    placeholder="e.g. You're in!"
                    disabled={pending}
                  />
                </Field>
                <Field label="Thank-you body" hint="Optional. Use a new line to start a new paragraph.">
                  <Textarea
                    value={draft.thankYouBody}
                    onChange={(event) => setDraft((current) => ({ ...current, thankYouBody: event.target.value }))}
                    rows={4}
                    disabled={pending}
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="pl-0.5 text-[12.5px] font-semibold text-slate-700">Preview</p>
                <div className="w-full max-w-[320px] rounded-2xl border border-slate-200 bg-white p-4">
                  {draft.thankYouTitle.trim() || thankYouParagraphs.length > 0 ? (
                    <>
                      {draft.thankYouTitle.trim() ? (
                        <p className="text-base font-bold text-slate-800">{draft.thankYouTitle.trim()}</p>
                      ) : null}
                      {thankYouParagraphs.map((paragraph, index) => (
                        <p key={index} className="mt-2 text-sm text-slate-600">
                          {paragraph}
                        </p>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Nothing to preview yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

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
            <dt className="font-semibold text-slate-500">Custom questions</dt>
            <dd className="text-slate-800">
              {selectedForm.fields.length === 0 ? (
                'None'
              ) : (
                <ul className="flex flex-col gap-1">
                  {selectedForm.fields.map((field) => (
                    <li key={field.id}>
                      {field.label}{' '}
                      <span className="text-slate-500">
                        ({field.id}) · {field.options.length} options{field.required ? ' · required' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
            {selectedForm.thankYouTitle ? (
              <>
                <dt className="font-semibold text-slate-500">Thank-you title</dt>
                <dd className="text-slate-800">{selectedForm.thankYouTitle}</dd>
              </>
            ) : null}
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
