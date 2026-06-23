import type { Integration, MetaIntegrationStatus } from '@/types/crm';

export function buildMetaIntegrationCard(status: MetaIntegrationStatus): Integration {
  const leadSummary =
    status.metaLeadsTotal > 0
      ? `${status.metaLeadsTotal} Meta lead${status.metaLeadsTotal === 1 ? '' : 's'} in CRM`
      : 'No Meta leads imported yet';

  const recent = status.metaLeads7d > 0 ? ` · ${status.metaLeads7d} in last 7 days` : '';

  const webhookNote = status.webhookConfigured ? 'Webhook endpoint configured' : 'Webhook endpoint not configured';

  const cardStatus: Integration['status'] =
    status.metaLeadsTotal > 0 ? 'warning' : status.webhookConfigured ? 'warning' : 'error';

  return {
    id: 'meta',
    name: 'Meta Lead Ads',
    subtitle: `${leadSummary}${recent} · ${webhookNote}`,
    status: cardStatus,
    color: '#5C65CF',
  };
}
