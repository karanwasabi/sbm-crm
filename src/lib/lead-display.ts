import { leadSourceLabel } from '@/lib/lead-sources';
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
    canPurge: lead.canPurge,
    marketingContactStatus: lead.marketingContactStatus,
    marketingContactSyncedAt: lead.marketingContactSyncedAt,
    marketingUnsubscribedAt: lead.marketingUnsubscribedAt,
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
  return formatLeadTimestamp(iso);
}

export function formatLeadTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const hour = String(hours12).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 < 12 ? 'am' : 'pm';

  return `${day}/${month}/${year} ${hour}:${minute} ${ampm}`;
}
