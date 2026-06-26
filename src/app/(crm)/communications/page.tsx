import { CommunicationsView } from '@/components/views/communications-view';
import { getCommsAnalytics, getMarketingContactsSummary, listAutomations, listEmailTemplates } from '@/utils/api';

export default async function CommunicationsPage() {
  let templates: Awaited<ReturnType<typeof listEmailTemplates>> = [];
  let automations: Awaited<ReturnType<typeof listAutomations>> = [];
  let marketingSummary: Awaited<ReturnType<typeof getMarketingContactsSummary>> = {
    used: 0,
    limit: 1000,
    percentUsed: 0,
  };
  let analytics: Awaited<ReturnType<typeof getCommsAnalytics>> | null = null;

  try {
    [templates, automations, marketingSummary, analytics] = await Promise.all([
      listEmailTemplates(),
      listAutomations(),
      getMarketingContactsSummary(),
      getCommsAnalytics(),
    ]);
  } catch {
    try {
      [templates, marketingSummary] = await Promise.all([listEmailTemplates(), getMarketingContactsSummary()]);
    } catch {
      try {
        automations = await listAutomations();
      } catch {
        // Page still renders with empty state if backend/migration not ready.
      }
    }
  }

  return (
    <CommunicationsView
      templates={templates}
      automations={automations}
      marketingSummary={marketingSummary}
      analytics={analytics}
    />
  );
}
