import { CommunicationsView } from '@/components/views/communications-view';
import {
  ApiError,
  getCommsAnalytics,
  getMarketingContactsSummary,
  listAutomations,
  listBulkLeadEmailSendJobs,
  listEmailTemplates,
} from '@/utils/api';

function rejectedErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError) {
    return reason.message;
  }
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }
  return fallback;
}

export default async function CommunicationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;

  const [templatesResult, automationsResult, bulkSendsResult, marketingResult, analyticsResult] =
    await Promise.allSettled([
      listEmailTemplates(),
      listAutomations(),
      listBulkLeadEmailSendJobs(),
      getMarketingContactsSummary(),
      getCommsAnalytics(),
    ]);

  const templates = templatesResult.status === 'fulfilled' ? templatesResult.value : [];
  const automations = automationsResult.status === 'fulfilled' ? automationsResult.value : [];
  const bulkSendJobs = bulkSendsResult.status === 'fulfilled' ? bulkSendsResult.value : [];
  const bulkSendJobsError =
    bulkSendsResult.status === 'rejected'
      ? rejectedErrorMessage(bulkSendsResult.reason, 'Failed to load bulk send jobs.')
      : null;
  const marketingSummary =
    marketingResult.status === 'fulfilled'
      ? marketingResult.value
      : { used: 0, activeSubscribers: 0, limit: 1000, percentUsed: 0, source: 'local' as const };
  const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;

  return (
    <CommunicationsView
      templates={templates}
      automations={automations}
      bulkSendJobs={bulkSendJobs}
      bulkSendJobsError={bulkSendJobsError}
      marketingSummary={marketingSummary}
      analytics={analytics}
      initialTab={tab}
    />
  );
}
