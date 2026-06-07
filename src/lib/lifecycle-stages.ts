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

export const STAGE_FILTER_OPTIONS = [
  { id: 'all', label: 'All', count: '12.4k' },
  { id: 'inquiry', label: 'Inquiry', count: '4.8k' },
  { id: 'engaged', label: 'Engaged', count: '2.1k' },
  { id: 'registered', label: 'Registered', count: '1.4k' },
  { id: 'active', label: 'Active', count: '1.3k' },
  { id: 'completed', label: 'Completed', count: '1.9k' },
  { id: 'renewal', label: 'Renewal', count: '28' },
  { id: 'lost', label: 'Lost', count: '920' },
] as const;
