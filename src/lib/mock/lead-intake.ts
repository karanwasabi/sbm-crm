import type { InboundLead, Integration } from '@/types/crm';

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'meta', name: 'Meta Lead Ads', subtitle: 'Last sync 2 min ago · 48 leads today', status: 'connected', color: '#5C65CF' },
  { id: 'whatsapp', name: 'WhatsApp (Convonite)', subtitle: 'Inbound bot active · 12 leads today', status: 'connected', color: '#10B981' },
  { id: 'website', name: 'Website forms', subtitle: '3 endpoints · 8 leads today', status: 'connected', color: '#0EA5E9' },
  { id: 'google', name: 'Google Ads', subtitle: 'API pending approval', status: 'warning', color: '#FFB703' },
];

export const MOCK_INBOUND_LOG: InboundLead[] = [
  { id: '1', name: 'Riya Sharma', source: 'meta', medium: 'paid', campaign: 'tc_july_batch', time: '2 min ago' },
  { id: '2', name: 'Dev Patel', source: 'website', medium: 'organic', campaign: 'homepage_enquiry', time: '14 min ago' },
  { id: '3', name: 'Kavya Nair', source: 'whatsapp', medium: 'organic', campaign: 'inbound_bot', time: '28 min ago' },
  { id: '4', name: 'Amit Desai', source: 'meta', medium: 'paid', campaign: 'retargeting_may', time: '1 hr ago' },
  { id: '5', name: 'Sneha Gupta', source: 'website', medium: 'organic', campaign: 'webinar_signup', time: '2 hr ago' },
];
