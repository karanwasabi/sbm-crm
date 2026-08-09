import type { Integration, MetaIntegrationStatus } from '@/types/crm';

export function buildMetaIntegrationCard(status: MetaIntegrationStatus): Integration {
  const breakdown =
    status.metaLeadsNativeTotal > 0 || status.metaLeadsImportedTotal > 0
      ? ` (${status.metaLeadsNativeTotal} native, ${status.metaLeadsImportedTotal} imported${status.metaLeadsUnknownTotal > 0 ? `, ${status.metaLeadsUnknownTotal} other` : ''})`
      : '';

  const leadSummary =
    status.metaLeadsTotal > 0
      ? `${status.metaLeadsTotal} Meta-attributed lead${status.metaLeadsTotal === 1 ? '' : 's'} in CRM${breakdown}`
      : 'No Meta leads in CRM yet';

  const recent = status.metaLeads7d > 0 ? ` · ${status.metaLeads7d} in last 7 days` : '';

  let automationNote: string;
  if (!status.automationAvailable) {
    automationNote = 'Live automation on production only';
  } else if (status.connected) {
    automationNote = 'Native Meta leadgen connected';
  } else if (status.webhookConfigured) {
    automationNote = 'Webhook configured · awaiting first lead';
  } else {
    automationNote = 'Configure Meta leadgen webhook on production';
  }

  const cardStatus: Integration['status'] = status.connected
    ? 'connected'
    : status.webhookConfigured || status.metaLeadsTotal > 0
      ? 'warning'
      : 'error';

  const capiNote = status.capiConfigured ? 'CAPI configured' : 'CAPI not configured';

  return {
    id: 'meta',
    name: 'Meta Lead Ads (native)',
    subtitle: `${leadSummary}${recent} · ${automationNote} · ${capiNote}`,
    status: cardStatus,
    color: '#5C65CF',
  };
}
