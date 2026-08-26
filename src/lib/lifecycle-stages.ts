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
  paused: { label: 'Paused', color: '#0284C7', tint: '#E0F2FE' },
  grace: { label: 'Grace', color: '#FFB703', tint: '#FEF3C7' },
  lapsed: { label: 'Lapsed', color: '#94A3B8', tint: '#F1F5F9' },
  transferred: { label: 'Transferred', color: '#64748B', tint: '#EEF2FF' },
  lost: { label: 'Lost', color: '#F43F5E', tint: '#FEE2E5' },
};
