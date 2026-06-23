import type { Integration, MetaIntegrationStatus } from '@/types/crm';

export function buildMetaIntegrationCard(status: MetaIntegrationStatus): Integration {
  if (status.connected) {
    return {
      id: 'meta',
      name: 'LeadSync',
      subtitle: `Connected · ${status.leadsToday} leads today · ${status.metaLeadsTotal} total`,
      status: 'connected',
      color: '#5C65CF',
    };
  }

  const webhookNote = status.webhookConfigured ? 'Webhook ready' : 'Webhook not configured';
  return {
    id: 'meta',
    name: 'Meta Lead Ads',
    subtitle: `${webhookNote} · ${status.metaLeadsTotal} leads in CRM · LeadSync not connected`,
    status: status.webhookConfigured ? 'warning' : 'error',
    color: '#5C65CF',
  };
}
