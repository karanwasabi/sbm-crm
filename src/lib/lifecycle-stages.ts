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
  active: { label: 'Active', color: '#10B981', tint: '#DCFCE7' },
  completed: { label: 'Completed', color: '#8338EC', tint: '#F3E8FF' },
  renewal: { label: 'Renewal', color: '#FFB703', tint: '#FEF3C7' },
  lost: { label: 'Lost', color: '#F43F5E', tint: '#FEE2E5' },
};
