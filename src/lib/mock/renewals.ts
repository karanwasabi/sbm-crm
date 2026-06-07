import type { DashboardKpi, RenewalAction, RenewalRow } from '@/types/crm';

export const MOCK_RENEWAL_KPIS: DashboardKpi[] = [
  { label: 'Due this month', value: '28', sub: '₹4.2L potential', trend: '+6', accent: '#FFB703' },
  { label: 'Achieved', value: '14', sub: '50% conversion', trend: '+3', accent: '#10B981' },
  { label: 'Missed', value: '4', sub: 'win-back queued', trend: '-2', accent: '#F43F5E' },
  { label: 'At-risk score', value: '12', sub: 'low engagement', trend: '+1', accent: '#5C65CF' },
];

export const MOCK_RENEWAL_ACTIONS: RenewalAction[] = [
  { id: '1', title: 'Send renewal reminders', subtitle: '28 contacts due in 14 days', count: 28, accent: '#FFB703' },
  { id: '2', title: 'Call at-risk members', subtitle: 'Low logging in last 7 days', count: 12, accent: '#F43F5E' },
  { id: '3', title: 'Win-back lapsed', subtitle: 'Churned in last 30 days', count: 8, accent: '#5C65CF' },
];

export const MOCK_RENEWAL_ROWS: RenewalRow[] = [
  { id: '1', name: 'Nisha Kothari', program: 'Take Control · S2', dueDate: 'May 15', amount: '₹1,490', status: 'due' },
  { id: '2', name: 'Rohan Kapur', program: 'Take Control', dueDate: 'May 12', amount: '₹1,490', status: 'achieved' },
  { id: '3', name: 'Anjali Reddy', program: 'Take Control', dueDate: 'May 18', amount: '₹1,490', status: 'due' },
  { id: '4', name: 'Arjun Mehta', program: 'Take Control', dueDate: 'Apr 28', amount: '₹1,490', status: 'missed' },
  { id: '5', name: 'Priya Verma', program: 'Take Control', dueDate: 'May 10', amount: '₹1,490', status: 'achieved' },
];
