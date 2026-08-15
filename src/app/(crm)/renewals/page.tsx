import { RenewalsView } from '@/components/views/renewals-view';
import { parseRenewalFilters, buildRenewalsSearchParams } from '@/lib/renewal-query';
import {
  getRenewalSummary,
  getWhatsAppFlags,
  listEmailTemplates,
  listRenewals,
  listWhatsAppTemplates,
} from '@/utils/api';
import type { RenewalSummary } from '@/types/crm';

const EMPTY_SUMMARY: RenewalSummary = {
  expiring7d: 0,
  expiring30d: 0,
  inGrace: 0,
  activeOrGrace: 0,
  atRiskCount: 0,
  atRiskMrrPaise: 0,
  cancellingCount: 0,
  paymentIssueCount: 0,
  churnedCount: 0,
  churnedThisMonth: 0,
  autoRenewedThisMonth: 0,
  healthyCount: 0,
  facets: { products: [], stages: [], memberKinds: [], access: [], buckets: [] },
};

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseRenewalFilters(params);
  const query = buildRenewalsSearchParams(filters).toString();

  const [summary, page] = await Promise.all([getRenewalSummary(query), listRenewals(query)]);

  const [emailTemplates, whatsappTemplates, whatsappFlags] = await Promise.all([
    listEmailTemplates().catch(() => []),
    listWhatsAppTemplates().catch(() => []),
    getWhatsAppFlags().catch(() => ({ sendsEnabled: false, templatesEnabled: false })),
  ]);

  return (
    <RenewalsView
      summary={summary ?? EMPTY_SUMMARY}
      page={page}
      filters={filters}
      emailTemplates={emailTemplates}
      whatsappTemplates={whatsappTemplates}
      whatsappSendsEnabled={whatsappFlags.sendsEnabled}
    />
  );
}
