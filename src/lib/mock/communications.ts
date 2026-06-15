import type { CampaignSequence, CommunicationRule, MessageTemplate } from '@/types/crm';

export const MOCK_RULES: CommunicationRule[] = [
  {
    id: '1',
    name: 'Meta lead welcome',
    trigger: 'Lead created',
    condition: 'Source = Meta',
    action: 'Send WhatsApp + assign rep',
    active: true,
  },
  {
    id: '2',
    name: 'Payment confirmation',
    trigger: 'Payment received',
    condition: 'Program = Take Control',
    action: 'Send email + update stage',
    active: true,
  },
  {
    id: '3',
    name: 'Renewal reminder',
    trigger: '7 days before expiry',
    condition: 'Stage = Active',
    action: 'Send email + WhatsApp',
    active: true,
  },
  {
    id: '4',
    name: 'Win-back lapsed',
    trigger: '30 days after churn',
    condition: 'Stage = Lost',
    action: 'Send win-back sequence',
    active: false,
  },
];

export const MOCK_TEMPLATES: MessageTemplate[] = [
  { id: '1', name: 'Welcome — Take Control', channel: 'Email', lastUsed: '2 hr ago' },
  { id: '2', name: 'Magic link onboarding', channel: 'WhatsApp', lastUsed: '1 hr ago' },
  { id: '3', name: 'Renewal — 7 day notice', channel: 'Email', lastUsed: 'Yesterday' },
  { id: '4', name: 'Program start nudge', channel: 'WhatsApp', lastUsed: '3 days ago' },
];

export const MOCK_SEQUENCES: CampaignSequence[] = [
  { id: '1', name: 'New lead nurture', steps: 5, enrolled: 412, status: 'Active' },
  { id: '2', name: 'Pre-program prep', steps: 3, enrolled: 86, status: 'Active' },
  { id: '3', name: 'Renewal outreach', steps: 4, enrolled: 28, status: 'Active' },
];
