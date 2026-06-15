import type { ApiKey, SettingsIntegration } from '@/types/crm';

export const MOCK_SETTINGS_INTEGRATIONS: SettingsIntegration[] = [
  {
    id: 'meta',
    name: 'Meta Ads',
    subtitle: 'Lead Ads + CAPI + Custom Audiences',
    status: 'connected',
    color: '#5C65CF',
  },
  { id: 'razorpay', name: 'Razorpay', subtitle: 'Payments + subscriptions', status: 'connected', color: '#0EA5E9' },
  { id: 'convonite', name: 'Convonite', subtitle: 'WhatsApp Business API', status: 'connected', color: '#10B981' },
  { id: 'resend', name: 'Resend', subtitle: 'Email broadcasts + transactional', status: 'connected', color: '#8338EC' },
  {
    id: 'google',
    name: 'Google Ads',
    subtitle: 'Conversion import · pending approval',
    status: 'warning',
    color: '#FFB703',
  },
  { id: 'zoom', name: 'Zoom', subtitle: 'Session links for online programs', status: 'connected', color: '#64748B' },
];

export const MOCK_API_KEYS: ApiKey[] = [
  { id: '1', label: 'Production webhook secret', key: 'whsec_live_xxxxxxxxxxxx', masked: true },
  { id: '2', label: 'Meta CAPI access token', key: 'EAAxxxxxxxxxxxx', masked: true },
  { id: '3', label: 'Lead ingestion API key', key: 'sbm_live_xxxxxxxxxxxx', masked: true },
];

export const MOCK_WEBHOOK_URL = 'https://api.slowburnmethod.com/webhooks/leads';
