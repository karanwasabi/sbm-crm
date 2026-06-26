import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { getLeadSummary, listLeads, listTagSuggestions } from '@/utils/api';
import { parseTagSlugsParam } from '@/lib/lead-tags';
import type { Lead, LeadSummary, TagFilterMode } from '@/types/crm';

const EMPTY_SUMMARY: LeadSummary = {
  total: 0,
  byStage: {
    inquiry: 0,
    engaged: 0,
    registered: 0,
    newbie: 0,
    member: 0,
    grace: 0,
    lapsed: 0,
    lost: 0,
    active: 0,
  },
};

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; marketing?: string; tags?: string; tag_mode?: string }>;
}) {
  const { stage, marketing, tags, tag_mode } = await searchParams;
  const activeStage = stage?.trim() || 'all';
  const activeMarketingStatus = marketing?.trim() || 'all';
  const activeTags = parseTagSlugsParam(tags);
  const activeTagMode: TagFilterMode = tag_mode?.trim() === 'or' ? 'or' : 'and';

  let leads: Lead[] = [];
  let summary = EMPTY_SUMMARY;
  let tagSuggestions: import('@/types/crm').TagSuggestion[] = [];

  try {
    [leads, summary, tagSuggestions] = await Promise.all([
      listLeads(activeStage, activeMarketingStatus, { tags: activeTags, tagMode: activeTagMode }),
      getLeadSummary(),
      listTagSuggestions(),
    ]);
  } catch {
    leads = [];
    summary = EMPTY_SUMMARY;
    tagSuggestions = [];
  }

  return (
    <LeadDatabaseView
      leads={leads}
      summary={summary}
      activeStage={activeStage}
      activeMarketingStatus={activeMarketingStatus}
      activeTags={activeTags}
      activeTagMode={activeTagMode}
      tagSuggestions={tagSuggestions}
    />
  );
}
