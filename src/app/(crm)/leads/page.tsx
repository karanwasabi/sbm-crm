import { LeadIntakeView } from '@/components/views/lead-intake-view';
import type { InboundLead, MetaIntegrationStatus } from '@/types/crm';
import type { Country } from '@/types/reference';
import { fetchCountries, getMetaInboundLeads, getMetaIntegrationStatus } from '@/utils/api';

const EMPTY_STATUS: MetaIntegrationStatus = {
  connected: false,
  provider: null,
  webhookConfigured: false,
  webhookUrl: '',
  leadsToday: 0,
  lastSyncAt: null,
  metaLeadsTotal: 0,
  metaLeads7d: 0,
};

export default async function LeadsPage() {
  let countries: Country[] = [];
  let integrationStatus = EMPTY_STATUS;
  let inboundLeads: InboundLead[] = [];

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

  return <LeadIntakeView countries={countries} integrationStatus={integrationStatus} inboundLeads={inboundLeads} />;
}
