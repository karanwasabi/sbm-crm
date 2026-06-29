'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createManualLead, checkManualLeadDuplicate, mergeManualLeadIntake } from '@/app/(crm)/leads/actions';
import { DuplicateLeadMergeDialog } from '@/components/leads/duplicate-lead-merge-dialog';
import { LeadTagEditor } from '@/components/leads/lead-tag-editor';
import { LazyCityCombobox, LazyCountryCombobox, LazyPhoneInput } from '@/components/profile/lazy-profile-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useLocationFields } from '@/hooks/use-location-fields';
import { isManualLeadSource } from '@/lib/lead-form';
import { toTitleCase } from '@/lib/title-case';
import { MANUAL_LEAD_SOURCE_OPTIONS } from '@/types/crm';
import type { IntakeDuplicateCheckResult, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  countryCode: '',
  city: '',
  manualSource: '' as const,
  notes: '',
  manualTags: [] as string[],
  consent: false,
};

type ManualLeadTabProps = {
  countries: Country[];
  tagSuggestions: TagSuggestion[];
};

export function ManualLeadTab({ countries, tagSuggestions }: ManualLeadTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [phoneSyncToken, setPhoneSyncToken] = useState(0);
  const [tagError, setTagError] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<IntakeDuplicateCheckResult | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const formValues = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    countryCode: form.countryCode,
    city: form.city,
    manualSource: isManualLeadSource(form.manualSource) ? form.manualSource : ('' as const),
    notes: form.notes,
    manualTags: form.manualTags,
    dpdpConsent: form.consent,
  };

  const { citySuggestions, loadingCities, handleCountryChange, handleCitySuggestion } = useLocationFields({
    countries,
    countryCode: form.countryCode,
    setCountryCode: (code) => setForm((current) => ({ ...current, countryCode: code })),
    setTimezoneId: () => {},
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setTagError(null);
    setPhoneSyncToken((token) => token + 1);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isManualLeadSource(form.manualSource)) {
      setError('Source is required.');
      return;
    }

    startTransition(async () => {
      const duplicateResult = await checkManualLeadDuplicate(formValues);
      if (!duplicateResult.ok) {
        setError(duplicateResult.error);
        toast({ message: duplicateResult.error, variant: 'error' });
        return;
      }

      if (duplicateResult.result.matchFound) {
        setDuplicateCheck(duplicateResult.result);
        setDuplicateDialogOpen(true);
        return;
      }

      const result = await createManualLead(formValues);
      if (result.error) {
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }

      toast({ message: 'Lead saved', variant: 'success' });
      resetForm();
      router.refresh();
    });
  };

  const handleAttachInquiry = () => {
    if (!duplicateCheck?.existing) return;
    startTransition(async () => {
      const result = await mergeManualLeadIntake(formValues, duplicateCheck.existing!.id, 'attach_inquiry', []);
      if (result.error) {
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }
      setDuplicateDialogOpen(false);
      setDuplicateCheck(null);
      toast({ message: 'Inquiry added to existing lead', variant: 'success' });
      resetForm();
      if (result.leadId) {
        router.push(`/customers/${result.leadId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleCreateSeparate = () => {
    startTransition(async () => {
      const result = await createManualLead(formValues, { forceSeparate: true });
      if (result.error) {
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }
      setDuplicateDialogOpen(false);
      setDuplicateCheck(null);
      toast({ message: 'Separate flagged lead created', variant: 'success' });
      resetForm();
      router.refresh();
    });
  };

  const canSave = form.consent && form.firstName.trim() && form.email.trim() && form.manualSource;

  return (
    <>
      <Card className="max-w-4xl overflow-visible">
        <SectionHead title="Manual lead entry" subtitle="Record offline and inbound leads with a source" />
        <Eyebrow className="mb-3">New lead</Eyebrow>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                value={form.firstName}
                onChange={(value) => setForm((current) => ({ ...current, firstName: toTitleCase(value) }))}
                placeholder="First name"
                disabled={pending}
              />
            </Field>
            <Field label="Last name">
              <TextInput
                value={form.lastName}
                onChange={(value) => setForm((current) => ({ ...current, lastName: toTitleCase(value) }))}
                placeholder="Last name"
                disabled={pending}
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                placeholder="email@example.com"
                type="email"
                disabled={pending}
              />
            </Field>
            <Field label="Phone">
              <LazyPhoneInput
                value={form.phone}
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                countries={countries}
                suggestedCountryIso={form.countryCode}
                syncToken={phoneSyncToken}
                disabled={pending}
              />
            </Field>
            <Field label="Country">
              <LazyCountryCombobox
                value={form.countryCode}
                onChange={handleCountryChange}
                countries={countries}
                disabled={pending}
              />
            </Field>
            <Field label="City" hint={loadingCities ? 'Loading suggestions…' : 'Start typing or pick a suggestion.'}>
              <LazyCityCombobox
                value={form.city}
                onChange={(value) => setForm((current) => ({ ...current, city: value }))}
                suggestions={citySuggestions}
                onSuggestionSelect={handleCitySuggestion}
                disabled={pending}
                loading={loadingCities}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Source">
              <select
                value={form.manualSource}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    manualSource: event.target.value as typeof form.manualSource,
                  }))
                }
                disabled={pending}
                className="h-11 w-full rounded-[14px] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select source</option>
                {MANUAL_LEAD_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Tags"
              hint="Optional. Source adds system tags on save."
              error={tagError}
              className="overflow-visible"
            >
              <LeadTagEditor
                bordered
                manualTags={form.manualTags}
                suggestions={tagSuggestions}
                disabled={pending}
                onError={setTagError}
                onManualTagsChange={(manualTags) => setForm((current) => ({ ...current, manualTags }))}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="What brought them in? Any context the next coach should know…"
              rows={3}
              disabled={pending}
            />
          </Field>

          <Checkbox
            checked={form.consent}
            onChange={(checked) => setForm((current) => ({ ...current, consent: checked }))}
            label="I confirm this contact has given explicit consent to be contacted (DPDP Act)."
            disabled={pending}
          />

          {error ? <p className="text-sm font-medium text-danger-press">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="md" onClick={resetForm} disabled={pending}>
              Clear
            </Button>
            <Button type="submit" variant="primary" loading={pending} loadingLabel="Saving…" disabled={!canSave}>
              Save lead
            </Button>
          </div>
        </form>
      </Card>

      {duplicateCheck && isManualLeadSource(form.manualSource) ? (
        <DuplicateLeadMergeDialog
          open={duplicateDialogOpen}
          checkResult={duplicateCheck}
          onClose={() => setDuplicateDialogOpen(false)}
          onAttachInquiry={handleAttachInquiry}
          onCreateSeparate={duplicateCheck.matchType === 'phone' ? handleCreateSeparate : undefined}
          pending={pending}
        />
      ) : null}
    </>
  );
}
