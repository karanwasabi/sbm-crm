import type { LifecycleStage } from '@/types/crm';

export type StageConfig = {
  label: string;
  color: string;
  tint: string;
};

export const LIFECYCLE_STAGES: Record<LifecycleStage, StageConfig> = {
  inquiry: { label: 'Inquiry', color: '#64748B', tint: '#F1F5F9' },
  engaged: { label: 'Engaged', color: '#5C65CF', tint: '#EEF0FF' },
  registered: { label: 'Registered', color: '#0EA5E9', tint: '#DBEEFE' },
  newbie: { label: 'Newbie', color: '#10B981', tint: '#DCFCE7' },
  member: { label: 'Member', color: '#8338EC', tint: '#F3E8FF' },
  grace: { label: 'Grace', color: '#FFB703', tint: '#FEF3C7' },
  lapsed: { label: 'Lapsed', color: '#94A3B8', tint: '#F1F5F9' },
  lost: { label: 'Lost', color: '#F43F5E', tint: '#FEE2E5' },
};

/** Aggregate filter: paying members in good standing (newbie + member + grace). */
export const ACTIVE_MEMBER_FILTER = {
  id: 'active',
  label: 'Active',
} as const;

export const ACTIVE_MEMBER_STAGES: LifecycleStage[] = ['newbie', 'member', 'grace'];
