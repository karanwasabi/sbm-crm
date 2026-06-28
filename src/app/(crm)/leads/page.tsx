import { LeadIntakeView } from '@/components/views/lead-intake-view';
import type { InboundLead, IntakeForm, MetaIntegrationStatus, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';
import {
  fetchCountries,
  getMetaInboundLeads,
  getMetaIntegrationStatus,
  listIntakeForms,
  listTagSuggestions,
} from '@/utils/api';

const EMPTY_STATUS: MetaIntegrationStatus = {
  connected: false,
  provider: null,
  automationAvailable: false,
  webhookConfigured: false,
  webhookUrl: '',
  leadsToday: 0,
  lastSyncAt: null,
  metaLeadsTotal: 0,
  metaLeads7d: 0,
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ tab?: string; form?: string }> }) {
  const { tab, form } = await searchParams;

  let countries: Country[] = [];
  let integrationStatus = EMPTY_STATUS;
  let inboundLeads: InboundLead[] = [];
  let tagSuggestions: TagSuggestion[] = [];
  let intakeForms: IntakeForm[] = [];

  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  try {
    [integrationStatus, inboundLeads] = await Promise.all([getMetaIntegrationStatus(), getMetaInboundLeads(20)]);
  } catch {
    integrationStatus = EMPTY_STATUS;
    inboundLeads = [];
  }

  try {
    tagSuggestions = await listTagSuggestions();
  } catch {
    tagSuggestions = [];
  }

  try {
    intakeForms = await listIntakeForms();
  } catch {
    intakeForms = [];
  }

  return (
    <LeadIntakeView
      countries={countries}
      integrationStatus={integrationStatus}
      inboundLeads={inboundLeads}
      tagSuggestions={tagSuggestions}
      intakeForms={intakeForms}
      initialTab={tab}
      initialFormId={form}
    />
  );
}
