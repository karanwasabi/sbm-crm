'use client';

import { Globe, MessageCircle, QrCode, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createManualLead } from '@/app/(crm)/leads/actions';
import { InboundLog } from '@/components/crm/inbound-log';
import { IntegrationCard } from '@/components/crm/integration-card';
import { CityCombobox } from '@/components/profile/city-combobox';
import { CountryCombobox } from '@/components/profile/country-combobox';
import { PhoneInput } from '@/components/profile/phone-input';
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
import { toTitleCase } from '@/lib/title-case';
import { MOCK_INBOUND_LOG, MOCK_INTEGRATIONS } from '@/lib/mock/lead-intake';
import { MANUAL_LEAD_SOURCE_OPTIONS } from '@/types/crm';
import type { Country } from '@/types/reference';

const INTEGRATION_ICONS = {
  meta: Share2,
  whatsapp: MessageCircle,
  website: Globe,
  google: Globe,
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
  consent: false,
};

type LeadIntakeViewProps = {
  countries: Country[];
};

export function LeadIntakeView({ countries }: LeadIntakeViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [phoneSyncToken, setPhoneSyncToken] = useState(0);

  const { citySuggestions, loadingCities, handleCountryChange, handleCitySuggestion } = useLocationFields({
    countries,
    countryCode: form.countryCode,
    setCountryCode: (code) => setForm((current) => ({ ...current, countryCode: code })),
    setTimezoneId: () => {},
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError(null);
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
        <Card>
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
                <PhoneInput
                  value={form.phone}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                  countries={countries}
                  suggestedCountryIso={form.countryCode}
                  syncToken={phoneSyncToken}
                  disabled={pending}
                />
              </Field>
              <Field label="Country">
                <CountryCombobox
                  value={form.countryCode}
                  onChange={handleCountryChange}
                  countries={countries}
                  disabled={pending}
                />
              </Field>
              <Field label="City" hint={loadingCities ? 'Loading suggestions…' : 'Start typing or pick a suggestion.'}>
                <CityCombobox
                  value={form.city}
                  onChange={(value) => setForm((current) => ({ ...current, city: value }))}
                  suggestions={citySuggestions}
                  onSuggestionSelect={handleCitySuggestion}
                  disabled={pending}
                  loading={loadingCities}
                />
              </Field>
            </div>

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
                className="w-full rounded-[14px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select source</option>
                {MANUAL_LEAD_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

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
              <Button type="submit" variant="primary" disabled={pending || !canSave}>
                Save lead
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead title="Integration health" subtitle="Inbound sources" />
            <div className="flex flex-col gap-2.5">
              {MOCK_INTEGRATIONS.map((integration) => {
                const Icon = INTEGRATION_ICONS[integration.id as keyof typeof INTEGRATION_ICONS] ?? Globe;
                return (
                  <IntegrationCard
                    key={integration.id}
                    name={integration.name}
                    subtitle={integration.subtitle}
                    icon={Icon}
                    color={integration.color}
                    status={integration.status}
                  />
                );
              })}
            </div>
          </Card>
          <InboundLog leads={MOCK_INBOUND_LOG} />
        </div>
      </div>

      <Card>
        <SectionHead
          title="QR code generator"
          subtitle="Link to landing page for event capture"
          right={<QrCode className="h-5 w-5 text-brand" />}
        />
        <div className="flex items-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-canvas-cool">
            <QrCode className="h-16 w-16 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Take Control enquiry page</p>
            <p className="mt-1 text-xs text-slate-500">slowburnmethod.com/enquire?utm_source=event</p>
            <Button variant="light" size="sm" className="mt-3">
              Download PNG
            </Button>
          </div>
        </div>
      </Card>
    </CrmPageLayout>
  );
}
