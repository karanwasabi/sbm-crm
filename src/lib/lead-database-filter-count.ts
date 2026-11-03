import type { LeadDatabaseFilters } from '@/lib/lead-database-url';

/** Count of toolbar filters excluding search and stage chips (those stay outside the sheet). */
export function countLeadDatabaseToolbarFilters(filters: LeadDatabaseFilters): number {
  let count = 0;
  count += filters.marketing.length;
  count += filters.programs.length;
  count += filters.batches.length;
  count += filters.geography.length;
  count += filters.sources.length;
  count += filters.coaches.length;
  count += filters.referrerCoaches.length;
  count += filters.renewalDurations.length;
  count += filters.eventIds.length;
  count += filters.eventSlotIds.length;
  count += filters.tags.length;
  count += filters.excludeTags.length;
  if (filters.addedFrom || filters.addedTo) count += 1;
  if (filters.updatedFrom || filters.updatedTo) count += 1;
  if (filters.paidFrom || filters.paidTo) count += 1;
  if (filters.convertedFrom || filters.convertedTo || filters.converted) count += 1;
  if (filters.purchaseKind) count += 1;
  if (filters.perfSource || filters.metaCampaignId || filters.metaCampaignUnattributed || filters.utmContent) {
    count += 1;
  }
  if (filters.hasUnseenSuggestions) count += 1;
  if (filters.createdByMe) count += 1;
  if (filters.phoneDuplicates) count += 1;
  if (filters.stars) count += 1;
  count += filters.accessExpiring.length;
  if (filters.offlineCrmPaid) count += 1;
  return count;
}
