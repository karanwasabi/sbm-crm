import type { Integration, MetaIntegrationStatus } from '@/types/crm';

export function buildMetaIntegrationCard(status: MetaIntegrationStatus): Integration {
  const leadSummary =
    status.metaLeadsTotal > 0
      ? `${status.metaLeadsTotal} Meta-attributed lead${status.metaLeadsTotal === 1 ? '' : 's'} in CRM`
      : 'No Meta leads in CRM yet';

  const recent = status.metaLeads7d > 0 ? ` · ${status.metaLeads7d} in last 7 days` : '';

  let automationNote: string;
  if (!status.automationAvailable) {
    automationNote = 'Live automation on production only';
  } else if (status.connected) {
    automationNote = 'LeadSync automated intake connected';
  } else if (status.webhookConfigured) {
    automationNote = 'Webhook configured · awaiting first lead';
  } else {
    automationNote = 'Configure LeadSync webhook on production';
  }

  const cardStatus: Integration['status'] = status.connected
    ? 'connected'
    : status.webhookConfigured || status.metaLeadsTotal > 0
      ? 'warning'
      : 'error';

  return {
    id: 'meta',
    name: 'Meta Lead Ads',
    subtitle: `${leadSummary}${recent} · ${automationNote}`,
    status: cardStatus,
    color: '#5C65CF',
  };
}
