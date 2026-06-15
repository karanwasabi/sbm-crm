import type { LifecycleStage, LeadSummary } from '@/types/crm';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';

export function formatLeadCount(count: number): string {
  if (count >= 1000) {
    const value = count / 1000;
    return value >= 10 ? `${Math.round(value)}k` : `${value.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}

export function buildStageFilterOptions(summary: LeadSummary) {
  const stages: { id: string; label: string; count: string }[] = [
    { id: 'all', label: 'All', count: formatLeadCount(summary.total) },
  ];

  (Object.keys(LIFECYCLE_STAGES) as LifecycleStage[]).forEach((stage) => {
    stages.push({
      id: stage,
      label: LIFECYCLE_STAGES[stage].label,
      count: formatLeadCount(summary.byStage[stage] ?? 0),
    });
  });

  return stages;
}

export function formatLeadAddedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
