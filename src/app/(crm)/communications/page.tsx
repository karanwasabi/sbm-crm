import { CommunicationsView } from '@/components/views/communications-view';
import { getCommsAnalytics, getMarketingContactsSummary, listAutomations, listEmailTemplates } from '@/utils/api';

export default async function CommunicationsPage() {
  const [templatesResult, automationsResult, marketingResult, analyticsResult] = await Promise.allSettled([
    listEmailTemplates(),
    listAutomations(),
    getMarketingContactsSummary(),
    getCommsAnalytics(),
  ]);

  const templates = templatesResult.status === 'fulfilled' ? templatesResult.value : [];
  const automations = automationsResult.status === 'fulfilled' ? automationsResult.value : [];
  const marketingSummary =
    marketingResult.status === 'fulfilled'
      ? marketingResult.value
      : { used: 0, activeSubscribers: 0, limit: 1000, percentUsed: 0, source: 'local' as const };
  const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;

  return (
    <CommunicationsView
      templates={templates}
      automations={automations}
      marketingSummary={marketingSummary}
      analytics={analytics}
    />
  );
}
