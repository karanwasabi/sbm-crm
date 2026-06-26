import { CommunicationsView } from '@/components/views/communications-view';
import { getCommsAnalytics, getMarketingContactsSummary, listEmailTemplates } from '@/utils/api';

export default async function CommunicationsPage() {
  let templates: Awaited<ReturnType<typeof listEmailTemplates>> = [];
  let marketingSummary: Awaited<ReturnType<typeof getMarketingContactsSummary>> = {
    used: 0,
    limit: 1000,
    percentUsed: 0,
  };
  let analytics: Awaited<ReturnType<typeof getCommsAnalytics>> | null = null;

  try {
    [templates, marketingSummary, analytics] = await Promise.all([
      listEmailTemplates(),
      getMarketingContactsSummary(),
      getCommsAnalytics(),
    ]);
  } catch {
    try {
      [templates, marketingSummary] = await Promise.all([listEmailTemplates(), getMarketingContactsSummary()]);
    } catch {
      // Page still renders with empty state if backend/migration not ready.
    }
  }

  return <CommunicationsView templates={templates} marketingSummary={marketingSummary} analytics={analytics} />;
}
