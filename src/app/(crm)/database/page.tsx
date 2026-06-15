import { LeadDatabaseView } from '@/components/views/lead-database-view';
import { getLeadSummary, listLeads } from '@/utils/api';
import type { Lead, LeadSummary } from '@/types/crm';

const EMPTY_SUMMARY: LeadSummary = {
  total: 0,
  byStage: {
    inquiry: 0,
    engaged: 0,
    registered: 0,
    active: 0,
    completed: 0,
    renewal: 0,
    lost: 0,
  },
};

export default async function DatabasePage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage } = await searchParams;
  const activeStage = stage?.trim() || 'all';

  let leads: Lead[] = [];
  let summary = EMPTY_SUMMARY;

  try {
    [leads, summary] = await Promise.all([listLeads(activeStage), getLeadSummary()]);
  } catch {
    leads = [];
    summary = EMPTY_SUMMARY;
  }

  return <LeadDatabaseView leads={leads} summary={summary} activeStage={activeStage} />;
}
