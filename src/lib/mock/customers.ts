import type { CustomerProfile, ProgramHistoryItem, TimelineEvent } from '@/types/crm';

export const MOCK_CUSTOMERS: Record<string, CustomerProfile> = {
  '9': {
    id: '9',
    name: 'Anjali Reddy',
    initials: 'AR',
    email: 'anjali@email.com',
    phone: '+91 98xx xx7700',
    location: 'Mumbai',
    joinedAt: '13 Apr 2026',
    stage: 'active',
    batch: 'Cohort C',
    tags: ['referral', 'vip'],
    clv: '₹46,800',
    programs: 3,
    loggingPct: 87,
  },
};

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: '1',
    kind: 'op',
    title: 'Payment received',
    body: 'Take Control · Cohort C — ₹14,900',
    meta: '28 Apr 2026 · Razorpay',
    color: '#10B981',
  },
  {
    id: '2',
    kind: 'comms',
    title: 'WhatsApp sent',
    body: 'Welcome sequence · Day 1',
    meta: '28 Apr 2026 · Delivered',
    color: '#5C65CF',
  },
  {
    id: '3',
    kind: 'comms',
    title: 'Email opened',
    body: 'Your Week 1 plan is ready',
    meta: '29 Apr 2026 · Resend',
    color: '#0EA5E9',
  },
  {
    id: '4',
    kind: 'op',
    title: 'Assigned to cohort',
    body: 'Cohort C · July batch',
    meta: '28 Apr 2026',
    color: '#8338EC',
  },
  {
    id: '5',
    kind: 'comms',
    title: 'Call logged',
    body: 'Interested · Will start logging tomorrow',
    meta: '27 Apr 2026 · Manual',
    color: '#FFB703',
  },
  {
    id: '6',
    kind: 'op',
    title: 'Lead created',
    body: 'Source: Referral · UTM: friend_share',
    meta: '26 Apr 2026',
    color: '#64748B',
  },
];

export const MOCK_PROGRAM_HISTORY: ProgramHistoryItem[] = [
  { program: 'Take Control', batch: 'Cohort C', status: 'Active', amount: '₹14,900', date: 'Apr 2026' },
  { program: 'Take Control', batch: 'Cohort A', status: 'Completed', amount: '₹14,900', date: 'Jan 2026' },
  { program: 'Take Control', batch: 'Cohort 9', status: 'Completed', amount: '₹12,900', date: 'Oct 2025' },
];

export function getCustomerById(id: string): CustomerProfile | null {
  return MOCK_CUSTOMERS[id] ?? MOCK_CUSTOMERS['9'];
}
