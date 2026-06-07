import type {
  CommsHealthItem,
  DashboardKpi,
  FunnelStep,
  GeoItem,
  RevenueWeek,
  SourcePerformanceRow,
} from '@/types/crm';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';

export const MOCK_KPIS: DashboardKpi[] = [
  {
    label: 'New leads (7d)',
    value: '412',
    sub: 'vs 358 last week',
    trend: '+15%',
    accent: '#5C65CF',
    spark: [5, 6, 7, 6, 8, 7, 9],
  },
  {
    label: 'Inquiry → Paid',
    value: '24.8%',
    sub: 'conversion rate',
    trend: '+2.1pp',
    accent: '#10B981',
    spark: [5, 5, 6, 6, 7, 7, 7.5],
  },
  {
    label: 'Active members',
    value: '1,284',
    sub: 'across 6 cohorts',
    trend: '+38',
    accent: LIFECYCLE_STAGES.completed.color,
    spark: [6, 7, 7, 7, 8, 8, 9],
  },
  {
    label: 'Revenue (₹L)',
    value: '₹12.4L',
    sub: 'this month · MTD',
    trend: '+18%',
    accent: '#FFB703',
    spark: [3, 4, 5, 6, 7, 8, 9],
  },
  {
    label: 'Renewals at risk',
    value: '28',
    sub: 'due in 14 days',
    trend: '-4',
    accent: '#F43F5E',
    spark: [9, 8, 8, 7, 6, 6, 5],
  },
];

export const MOCK_FUNNEL: FunnelStep[] = [
  { label: 'Inquiry', count: 1248, color: LIFECYCLE_STAGES.inquiry.color },
  { label: 'Engaged', count: 742, color: LIFECYCLE_STAGES.engaged.color },
  { label: 'Registered', count: 412, color: LIFECYCLE_STAGES.registered.color },
  { label: 'Paid', count: 318, color: '#10B981' },
  { label: 'Completed', count: 268, color: LIFECYCLE_STAGES.completed.color },
];

export const MOCK_SOURCE_ROWS: SourcePerformanceRow[] = [
  { source: 'Meta — Lead Ads', medium: 'paid', leads: 524, paid: 142, cvr: 0.27, cac: 412 },
  { source: 'WhatsApp — Convonite', medium: 'organic', leads: 318, paid: 96, cvr: 0.3, cac: 0 },
  { source: 'Website forms', medium: 'organic', leads: 226, paid: 58, cvr: 0.26, cac: 0 },
  { source: 'Google — Search', medium: 'paid', leads: 184, paid: 32, cvr: 0.17, cac: 612 },
  { source: 'Walk-in / events', medium: 'offline', leads: 92, paid: 38, cvr: 0.41, cac: 220 },
  { source: 'Referral', medium: 'organic', leads: 64, paid: 28, cvr: 0.44, cac: 0 },
];

export const MOCK_REVENUE: RevenueWeek[] = [
  { week: 'W1', revenue: 4.2, spend: 1.8 },
  { week: 'W2', revenue: 5.6, spend: 2.0 },
  { week: 'W3', revenue: 7.2, spend: 2.2 },
  { week: 'W4', revenue: 6.8, spend: 2.4 },
  { week: 'W5', revenue: 9.4, spend: 2.6 },
  { week: 'W6', revenue: 11.2, spend: 2.9 },
  { week: 'W7', revenue: 13.8, spend: 3.1 },
  { week: 'W8', revenue: 12.4, spend: 3.3 },
];

export const MOCK_GEO: GeoItem[] = [
  { city: 'Mumbai', pct: 0.28, color: '#5C65CF' },
  { city: 'Bengaluru', pct: 0.22, color: LIFECYCLE_STAGES.completed.color },
  { city: 'Delhi NCR', pct: 0.18, color: '#0EA5E9' },
  { city: 'Pune', pct: 0.11, color: '#10B981' },
  { city: 'Hyderabad', pct: 0.09, color: '#FFB703' },
  { city: 'Others', pct: 0.12, color: '#90A1B9' },
];

export const MOCK_COMMS_HEALTH: CommsHealthItem[] = [
  { channel: 'WhatsApp', sent: 4280, delivered: 0.98, openRate: 0.84, color: '#10B981' },
  { channel: 'Email', sent: 6120, delivered: 0.99, openRate: 0.42, color: '#5C65CF' },
  { channel: 'SMS', sent: 1840, delivered: 0.96, openRate: 0.31, color: '#FFB703' },
];
