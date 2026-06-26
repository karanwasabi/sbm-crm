import type { Integration, RazorpayIntegrationStatus } from '@/types/crm';

export function buildRazorpayIntegrationCard(status: RazorpayIntegrationStatus): Integration {
  if (!status.configured) {
    return {
      id: 'razorpay',
      name: 'Razorpay',
      subtitle: 'API keys not configured on backend',
      status: 'error',
      color: '#0EA5E9',
    };
  }

  const webhookNote = status.webhookConfigured ? 'Webhooks configured' : 'Webhook secret not set';

  return {
    id: 'razorpay',
    name: 'Razorpay',
    subtitle: `Payments + subscriptions · ${webhookNote}`,
    status: status.webhookConfigured ? 'connected' : 'warning',
    color: '#0EA5E9',
  };
}
