import type { LifecycleStage, LeadSummary } from '@/types/crm';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';

export function formatLeadCount(count: number): string {
  if (count >= 1000) {
    const value = count / 1000;
    return value >= 10 ? `${Math.round(value)}k` : `${value.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}

export function leadDatabaseSubtitle(total: number): string {
  if (total === 0) return 'No leads yet';
  if (total === 1) return '1 lead';
  return `${total.toLocaleString('en-IN')} leads`;
}

const MANUAL_SOURCE_LABELS: Record<import('@/types/crm').ManualLeadSource, string> = {
  walk_in: 'Walk-in',
  event_booth: 'Event booth',
  phone_enquiry: 'Phone enquiry',
  referral: 'Referral',
  other: 'Other',
};

export function manualSourceLabel(source: import('@/types/crm').ManualLeadSource): string {
  return MANUAL_SOURCE_LABELS[source] ?? source;
}

export function initialsFromName(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  }
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function leadDetailToContactProfile(
  lead: import('@/types/crm').LeadDetail
): import('@/types/crm').ContactProfile {
  return {
    id: lead.id,
    name: lead.name,
    initials: initialsFromName(lead.firstName, lead.lastName, lead.email),
    email: lead.email,
    phone: lead.phone,
    location: lead.location || '—',
    joinedAt: formatLeadAddedAt(lead.addedAt),
    stage: lead.stage,
    batch: lead.batch,
    tags: lead.tags,
    manualSourceLabel: manualSourceLabel(lead.manualSource),
    notes: lead.notes,
    isMember: Boolean(lead.memberUserId),
    canMarkLost: lead.canMarkLost,
  };
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
