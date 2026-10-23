'use client';

import Link from 'next/link';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { buildLeadDatabaseHref, MARKETING_FILTER_OPTIONS, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { formatPaidRangeChip } from '@/lib/ist-datetime';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import { leadSourceLabel, perfSourceLabel } from '@/lib/lead-sources';
import { renewalDurationFilterLabel } from '@/lib/renewal-duration';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { LeadFilterOptions } from '@/types/crm';
import type { EventOption } from '@/types/events';

type LeadDatabaseActiveFiltersProps = {
  filters: LeadDatabaseFilters;
  filterOptions?: LeadFilterOptions;
  eventOptions?: EventOption[];
};

function coachChipLabel(value: string, filterOptions?: LeadFilterOptions): string {
  if (value === 'unassigned') return 'Unassigned';
  const match = filterOptions?.coaches.find((option) => option.value === value);
  return match?.label || value;
}

function referrerCoachChipLabel(value: string, filterOptions?: LeadFilterOptions): string {
  if (value === 'unassigned') return 'Unassigned';
  const match = filterOptions?.referrerCoaches.find((option) => option.value === value);
  return match?.label || value;
}

function eventChipLabel(value: string, eventOptions?: EventOption[]): string {
  return eventOptions?.find((event) => event.id === value)?.name || value;
}

function eventSlotChipLabel(value: string, eventOptions?: EventOption[]): string {
  for (const event of eventOptions ?? []) {
    const slot = event.slots.find((item) => item.id === value);
    if (!slot) continue;
    // Prefer the readable slot time; append event name only when multiple events exist.
    if ((eventOptions?.length ?? 0) > 1) return `${slot.label} · ${event.name}`;
    return slot.label;
  }
  return value;
}

export function LeadDatabaseActiveFilters({ filters, filterOptions, eventOptions }: LeadDatabaseActiveFiltersProps) {
  const chips: Array<{ key: string; label: string; value: string; href: string }> = [];

  filters.stages.forEach((stage) => {
    chips.push({
      key: `stage-${stage}`,
      label: 'Stage',
      value: LIFECYCLE_STAGES[stage as keyof typeof LIFECYCLE_STAGES]?.label ?? stage,
      href: buildLeadDatabaseHref(filters, { stages: filters.stages.filter((item) => item !== stage) }),
    });
  });
  if (filters.q) {
    chips.push({
      key: 'q',
      label: 'Search',
      value: filters.q,
      href: buildLeadDatabaseHref(filters, { q: '' }),
    });
  }
  filters.marketing.forEach((status) => {
    chips.push({
      key: `marketing-${status}`,
      label: 'Marketing',
      value: MARKETING_FILTER_OPTIONS.find((option) => option.id === status)?.label ?? status,
      href: buildLeadDatabaseHref(filters, {
        marketing: filters.marketing.filter((item) => item !== status),
      }),
    });
  });
  if (filters.hasUnseenSuggestions) {
    chips.push({
      key: 'has-unseen-suggestions',
      label: 'Updates',
      value: 'Unseen only',
      href: buildLeadDatabaseHref(filters, { hasUnseenSuggestions: false }),
    });
  }
  if (filters.phoneDuplicates) {
    chips.push({
      key: 'phone-duplicates',
      label: 'Duplicates',
      value: 'Phone only',
      href: buildLeadDatabaseHref(filters, { phoneDuplicates: false }),
    });
  }
  if (filters.starsUnredeemed) {
    chips.push({
      key: 'stars-unredeemed',
      label: 'Stars',
      value: 'Can redeem, never redeemed',
      href: buildLeadDatabaseHref(filters, { starsUnredeemed: false }),
    });
  }
  filters.tags.forEach((tag) => {
    chips.push({
      key: `tag-${tag}`,
      label: 'Tag',
      value: tagSlugToLabel(tag),
      href: buildLeadDatabaseHref(filters, { tags: filters.tags.filter((item) => item !== tag) }),
    });
  });
  filters.excludeTags.forEach((tag) => {
    chips.push({
      key: `exclude-tag-${tag}`,
      label: 'Exclude tag',
      value: tagSlugToLabel(tag),
      href: buildLeadDatabaseHref(filters, {
        excludeTags: filters.excludeTags.filter((item) => item !== tag),
      }),
    });
  });
  filters.programs.forEach((program) => {
    chips.push({
      key: `program-${program}`,
      label: 'Program',
      value: program,
      href: buildLeadDatabaseHref(filters, { programs: filters.programs.filter((item) => item !== program) }),
    });
  });
  filters.batches.forEach((batch) => {
    chips.push({
      key: `batch-${batch}`,
      label: 'Batch',
      value: batch,
      href: buildLeadDatabaseHref(filters, { batches: filters.batches.filter((item) => item !== batch) }),
    });
  });
  filters.geography.forEach((geo) => {
    chips.push({
      key: `geo-${geo}`,
      label: 'Geography',
      value: geo,
      href: buildLeadDatabaseHref(filters, { geography: filters.geography.filter((item) => item !== geo) }),
    });
  });
  filters.sources.forEach((source) => {
    chips.push({
      key: `source-${source}`,
      label: 'Source',
      value: leadSourceLabel(source) || source,
      href: buildLeadDatabaseHref(filters, { sources: filters.sources.filter((item) => item !== source) }),
    });
  });
  filters.coaches.forEach((coach) => {
    chips.push({
      key: `coach-${coach}`,
      label: 'Coach',
      value: coachChipLabel(coach, filterOptions),
      href: buildLeadDatabaseHref(filters, { coaches: filters.coaches.filter((item) => item !== coach) }),
    });
  });
  filters.referrerCoaches.forEach((coach) => {
    chips.push({
      key: `referrer-coach-${coach}`,
      label: "Referrer's coach",
      value: referrerCoachChipLabel(coach, filterOptions),
      href: buildLeadDatabaseHref(filters, {
        referrerCoaches: filters.referrerCoaches.filter((item) => item !== coach),
      }),
    });
  });
  if (filters.addedFrom || filters.addedTo) {
    chips.push({
      key: 'added',
      label: 'Added',
      value: [filters.addedFrom, filters.addedTo].filter(Boolean).join(' → '),
      href: buildLeadDatabaseHref(filters, { addedFrom: '', addedTo: '' }),
    });
  }
  if (filters.paidFrom || filters.paidTo) {
    chips.push({
      key: 'paid',
      label: 'Paid',
      value: formatPaidRangeChip(filters.paidFrom, filters.paidTo),
      href: buildLeadDatabaseHref(filters, { paidFrom: '', paidTo: '' }),
    });
  }
  if (filters.purchaseKind === 'new' || filters.purchaseKind === 'renewal') {
    chips.push({
      key: 'purchase-kind',
      label: 'Purchase',
      value: filters.purchaseKind === 'renewal' ? 'Renewal' : 'New',
      href: buildLeadDatabaseHref(filters, { purchaseKind: '' }),
    });
  }
  if (filters.perfSource) {
    chips.push({
      key: 'perf-source',
      label: 'Performance source',
      value: perfSourceLabel(filters.perfSource),
      href: buildLeadDatabaseHref(filters, { perfSource: '' }),
    });
  }
  if (filters.metaCampaignId) {
    chips.push({
      key: 'meta-campaign',
      label: 'Meta campaign',
      value: filters.metaCampaignId,
      href: buildLeadDatabaseHref(filters, { metaCampaignId: '' }),
    });
  }
  if (filters.metaCampaignUnattributed) {
    chips.push({
      key: 'meta-campaign-unattributed',
      label: 'Meta campaign',
      value: 'Unattributed',
      href: buildLeadDatabaseHref(filters, { metaCampaignUnattributed: false }),
    });
  }
  if (filters.utmContent) {
    chips.push({
      key: 'utm-content',
      label: 'Ad (utm_content)',
      value: filters.utmContent,
      href: buildLeadDatabaseHref(filters, { utmContent: '' }),
    });
  }
  if (filters.offlineCrmPaid) {
    chips.push({
      key: 'offline-crm-paid',
      label: 'Enrollment type',
      value: 'Offline CRM',
      href: buildLeadDatabaseHref(filters, { offlineCrmPaid: false }),
    });
  }
  filters.renewalDurations.forEach((duration) => {
    chips.push({
      key: `renewal-duration-${duration}`,
      label: 'Renewal',
      value: renewalDurationFilterLabel(duration),
      href: buildLeadDatabaseHref(filters, {
        renewalDurations: filters.renewalDurations.filter((item) => item !== duration),
      }),
    });
  });
  filters.eventIds.forEach((eventId) => {
    chips.push({
      key: `event-${eventId}`,
      label: 'Event',
      value: eventChipLabel(eventId, eventOptions),
      href: buildLeadDatabaseHref(filters, { eventIds: filters.eventIds.filter((item) => item !== eventId) }),
    });
  });
  filters.eventSlotIds.forEach((slotId) => {
    chips.push({
      key: `event-slot-${slotId}`,
      label: 'Event slot',
      value: eventSlotChipLabel(slotId, eventOptions),
      href: buildLeadDatabaseHref(filters, {
        eventSlotIds: filters.eventSlotIds.filter((item) => item !== slotId),
      }),
    });
  });
  if (filters.updatedFrom || filters.updatedTo) {
    chips.push({
      key: 'updated',
      label: 'Updated',
      value: [filters.updatedFrom, filters.updatedTo].filter(Boolean).join(' → '),
      href: buildLeadDatabaseHref(filters, { updatedFrom: '', updatedTo: '' }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/15 bg-brand/5 px-3 py-2">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} className="no-underline">
          <ActiveFilterTag label={chip.label} value={chip.value} onDismiss={() => undefined} />
        </Link>
      ))}
      <Link
        href={buildLeadDatabaseHref(filters, {
          stages: [],
          q: '',
          marketing: [],
          tags: [],
          excludeTags: [],
          tagMode: 'and',
          programs: [],
          batches: [],
          geography: [],
          sources: [],
          coaches: [],
          referrerCoaches: [],
          addedFrom: '',
          addedTo: '',
          paidFrom: '',
          paidTo: '',
          offlineCrmPaid: false,
          purchaseKind: '',
          renewalDurations: [],
          eventIds: [],
          eventSlotIds: [],
          perfSource: '',
          metaCampaignId: '',
          metaCampaignUnattributed: false,
          utmContent: '',
          updatedFrom: '',
          updatedTo: '',
          hasUnseenSuggestions: false,
          phoneDuplicates: false,
          starsUnredeemed: false,
          sort: 'created_at',
          order: 'desc',
        })}
        className="text-xs font-semibold text-brand no-underline"
      >
        Clear all
      </Link>
    </div>
  );
}
