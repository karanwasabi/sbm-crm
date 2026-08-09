import { LeadIntakeView } from '@/components/views/lead-intake-view';
import { isMarketingOnly } from '@/lib/access';
import type {
  InboundLead,
  IntakeForm,
  MetaIntegrationStatus,
  MetaPurchaseDailyReport,
  TagSuggestion,
} from '@/types/crm';
import type { Country } from '@/types/reference';
import { getMyAccess, listIntakeForms, listTagSuggestions } from '@/utils/api';
import { fetchCountries } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';

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
  capiConfigured: false,
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ tab?: string; form?: string }> }) {
  const { tab, form } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMarketing = false;
  try {
    const access = await getMyAccess();
    isMarketing = isMarketingOnly(access.roles);
  } catch {
    isMarketing = false;
  }

  let countries: Country[] = [];
  let integrationStatus = EMPTY_STATUS;
  let inboundLeads: InboundLead[] = [];
  let purchaseDaily: MetaPurchaseDailyReport | null = null;
  let purchaseDailyError: string | null = null;
  let tagSuggestions: TagSuggestion[] = [];
  let intakeForms: IntakeForm[] = [];

  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  if (!isMarketing) {
    try {
      const { getMetaIntegrationStatus, getMetaInboundLeads, getMetaPurchaseDaily } = await import('@/utils/api');
      const [status, leads, daily] = await Promise.all([
        getMetaIntegrationStatus(),
        getMetaInboundLeads(20),
        getMetaPurchaseDaily(30),
      ]);
      integrationStatus = status;
      inboundLeads = leads;
      purchaseDaily = daily;
    } catch (error) {
      integrationStatus = EMPTY_STATUS;
      inboundLeads = [];
      purchaseDaily = null;
      purchaseDailyError = error instanceof Error ? error.message : 'Failed to load meta purchase report.';
    }
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
      purchaseDaily={purchaseDaily}
      purchaseDailyError={purchaseDailyError}
      tagSuggestions={tagSuggestions}
      intakeForms={intakeForms}
      initialTab={tab}
      initialFormId={form}
      isMarketing={isMarketing}
      currentUserId={user?.id ?? ''}
    />
  );
}
