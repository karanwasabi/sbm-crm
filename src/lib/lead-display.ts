import { leadSourceLabel } from '@/lib/lead-sources';
import { formatLeadTimestamp as formatLeadTimestampInTimezone } from '@/lib/datetime-display';
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

export function leadDatabaseRangeLabel(total: number, page: number, pageSize: number): string {
  if (total === 0) return 'Showing 0 of 0';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start.toLocaleString('en-IN')}–${end.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')}`;
}

export function manualSourceLabel(source: import('@/types/crm').ManualLeadSource): string {
  return leadSourceLabel(source);
}

export function initialsFromName(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  }
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function leadDetailToContactProfile(
  lead: import('@/types/crm').LeadDetail,
  timezoneId?: string | null
): import('@/types/crm').ContactProfile {
  const liveBatch = lead.cohortName?.trim() || lead.batch;
  return {
    id: lead.id,
    name: lead.name,
    initials: initialsFromName(lead.firstName, lead.lastName, lead.email),
    email: lead.email,
    phone: lead.phone,
    location: lead.location || '—',
    joinedAt: formatLeadAddedAt(lead.addedAt, timezoneId),
    stage: lead.stage,
    batch: liveBatch,
    tags: lead.tags,
    manualSourceLabel: manualSourceLabel(lead.manualSource),
    notes: lead.notes,
    isMember: Boolean(lead.memberUserId),
    canMarkLost: lead.canMarkLost,
    canPurge: lead.canPurge,
    marketingContactStatus: lead.marketingContactStatus,
    marketingContactSyncedAt: lead.marketingContactSyncedAt,
    marketingUnsubscribedAt: lead.marketingUnsubscribedAt,
    coachName: lead.coachName ?? null,
    cohortId: lead.cohortId ?? null,
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

export function formatLeadAddedAt(iso: string, timezoneId?: string | null): string {
  return formatLeadTimestamp(iso, timezoneId);
}

export function formatLeadTimestamp(iso: string, timezoneId?: string | null): string {
  return formatLeadTimestampInTimezone(iso, timezoneId);
}
