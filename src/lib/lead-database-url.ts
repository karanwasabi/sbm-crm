import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { formatTagSlugsParam } from '@/lib/lead-tags';
import type { MarketingContactStatus, TagFilterMode } from '@/types/crm';

export const MARKETING_FILTER_OPTIONS: Array<{ id: MarketingContactStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All contacts' },
  { id: 'active', label: MARKETING_CONTACT_STATUS_LABELS.active },
  { id: 'eligible', label: MARKETING_CONTACT_STATUS_LABELS.eligible },
  { id: 'no_consent', label: MARKETING_CONTACT_STATUS_LABELS.no_consent },
  { id: 'unsubscribed', label: MARKETING_CONTACT_STATUS_LABELS.unsubscribed },
];

export function buildLeadDatabaseHref(
  stageId: string,
  marketingStatus: string,
  tags: string[],
  tagMode: TagFilterMode
): string {
  const params = new URLSearchParams();
  if (stageId !== 'all') params.set('stage', stageId);
  if (marketingStatus !== 'all') params.set('marketing', marketingStatus);
  if (tags.length > 0) params.set('tags', formatTagSlugsParam(tags));
  if (tags.length > 0 && tagMode === 'or') params.set('tag_mode', 'or');
  const query = params.toString();
  return query ? `/database?${query}` : '/database';
}
