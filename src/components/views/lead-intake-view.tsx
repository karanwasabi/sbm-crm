'use client';

import { Globe, MessageCircle, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createManualLead } from '@/app/(crm)/leads/actions';
import { InboundLog } from '@/components/crm/inbound-log';
import { IntegrationCard } from '@/components/crm/integration-card';
import { LeadTagEditor } from '@/components/leads/lead-tag-editor';
import { LazyCityCombobox, LazyCountryCombobox, LazyPhoneInput } from '@/components/profile/lazy-profile-fields';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
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
import { buildMetaIntegrationCard } from '@/lib/meta-integration';
import { toTitleCase } from '@/lib/title-case';
import { MANUAL_LEAD_SOURCE_OPTIONS } from '@/types/crm';
import type { InboundLead, MetaIntegrationStatus, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';

const INTEGRATION_ICONS = {
  meta: Share2,
  whatsapp: MessageCircle,
  website: Globe,
};

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

type LeadIntakeViewProps = {
  countries: Country[];
  integrationStatus: MetaIntegrationStatus;
  inboundLeads: InboundLead[];
  tagSuggestions: TagSuggestion[];
};

export function LeadIntakeView({ countries, integrationStatus, inboundLeads, tagSuggestions }: LeadIntakeViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [phoneSyncToken, setPhoneSyncToken] = useState(0);
  const [tagError, setTagError] = useState<string | null>(null);

  const metaIntegration = buildMetaIntegrationCard(integrationStatus);

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

    startTransition(async () => {
      const result = await createManualLead({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        countryCode: form.countryCode,
        city: form.city,
        manualSource: isManualLeadSource(form.manualSource) ? form.manualSource : '',
        notes: form.notes,
        manualTags: form.manualTags,
        dpdpConsent: form.consent,
      });

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

  const canSave = form.consent && form.firstName.trim() && form.email.trim() && form.manualSource;

  return (
    <CrmPageLayout>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="overflow-visible">
          <SectionHead title="Manual lead entry" subtitle="Offline events, walk-ins, IG DMs" />
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

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead title="Integration health" subtitle="Inbound sources" />
            <div className="flex flex-col gap-2.5">
              <IntegrationCard
                name={metaIntegration.name}
                subtitle={metaIntegration.subtitle}
                icon={INTEGRATION_ICONS.meta}
                color={metaIntegration.color}
                status={metaIntegration.status}
              />
            </div>
          </Card>
          <InboundLog leads={inboundLeads} />
        </div>
      </div>
    </CrmPageLayout>
  );
}
