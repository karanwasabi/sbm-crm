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

export async function loadCommunicationsPageData() {
  const [templatesResult, automationsResult, bulkSendsResult, marketingResult, analyticsResult] =
    await Promise.allSettled([
      listEmailTemplates(),
      listAutomations(),
      listBulkLeadEmailSendJobs(),
      getMarketingContactsSummary(),
      getCommsAnalytics(),
    ]);

  return {
    templates: templatesResult.status === 'fulfilled' ? templatesResult.value : [],
    automations: automationsResult.status === 'fulfilled' ? automationsResult.value : [],
    bulkSendJobs: bulkSendsResult.status === 'fulfilled' ? bulkSendsResult.value : [],
    bulkSendJobsError:
      bulkSendsResult.status === 'rejected'
        ? rejectedErrorMessage(bulkSendsResult.reason, 'Failed to load bulk send jobs.')
        : null,
    marketingSummary:
      marketingResult.status === 'fulfilled'
        ? marketingResult.value
        : { used: 0, activeSubscribers: 0, limit: 1000, percentUsed: 0, source: 'local' as const },
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
}
