import type { DashboardAnalytics } from '@/types/crm';

const FUNNEL_STAGES = [
  { stage: 'inquiry', label: 'Inquiry' },
  { stage: 'engaged', label: 'Engaged' },
  { stage: 'registered', label: 'Registered' },
  { stage: 'newbie', label: 'Newbie' },
  { stage: 'member', label: 'Member' },
  { stage: 'grace', label: 'Grace' },
  { stage: 'lapsed', label: 'Lapsed' },
  { stage: 'lost', label: 'Lost' },
] as const;

export const DASHBOARD_FUNNEL_STAGES = FUNNEL_STAGES;

export function normalizeDashboardFunnel(
  funnel: Array<{ stage: string; label: string; count: number }>
): Array<{ stage: string; label: string; count: number }> {
  const counts = new Map(funnel.map((step) => [step.stage, step.count]));
  return FUNNEL_STAGES.map((step) => ({
    ...step,
    count: counts.get(step.stage) ?? 0,
  }));
}

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
