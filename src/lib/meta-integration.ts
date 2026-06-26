import type { Integration, MetaIntegrationStatus } from '@/types/crm';

export function buildMetaIntegrationCard(status: MetaIntegrationStatus): Integration {
  const leadSummary =
    status.metaLeadsTotal > 0
      ? `${status.metaLeadsTotal} Meta-attributed lead${status.metaLeadsTotal === 1 ? '' : 's'} in CRM`
      : 'No Meta leads in CRM yet';

  const recent = status.metaLeads7d > 0 ? ` · ${status.metaLeads7d} in last 7 days` : '';

  const automationNote = status.connected
    ? 'Automated intake connected'
    : 'Manual CSV import only · automation not connected';

  const cardStatus: Integration['status'] = status.connected
    ? 'connected'
    : status.metaLeadsTotal > 0
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
