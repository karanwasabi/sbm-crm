import type { DashboardAnalytics } from '@/types/crm';

const FUNNEL_STAGES = [
  { stage: 'inquiry', label: 'Inquiry' },
  { stage: 'engaged', label: 'Engaged' },
  { stage: 'registered', label: 'Registered' },
  { stage: 'active', label: 'Active' },
  { stage: 'completed', label: 'Completed' },
] as const;

export function emptyDashboardAnalytics(): DashboardAnalytics {
  return {
    kpis: {
      newLeads7d: 0,
      newLeadsPrev7d: 0,
      totalLeads: 0,
      conversionRate: 0,
      activeMembers: 0,
      activeCohorts: 0,
      revenueMtdPaise: 0,
      revenuePrevMtdPaise: 0,
      renewalsAtRisk: 0,
    },
    newLeadsSparkline: [0, 0, 0, 0, 0, 0, 0],
    funnel: FUNNEL_STAGES.map((step) => ({ ...step, count: 0 })),
    revenueWeekly: [],
    geo: [],
  };
}
