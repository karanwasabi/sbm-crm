import {
  ApiError,
  getCommsAnalytics,
  getCommsAnalyticsSummary,
  getMarketingContactsSummary,
  listAutomations,
  listBulkLeadEmailSendJobs,
  listEmailTemplates,
  type CommsAnalyticsSummary,
  type MarketingContactsSummary,
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

const DEFAULT_MARKETING_SUMMARY: MarketingContactsSummary = {
  used: 0,
  activeSubscribers: 0,
  limit: 1000,
  percentUsed: 0,
  source: 'local',
};

type CommsHeaderData = {
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
};

async function loadCommsHeaderData(): Promise<CommsHeaderData> {
  const [marketingResult, analyticsResult] = await Promise.allSettled([
    getMarketingContactsSummary(),
    getCommsAnalyticsSummary(),
  ]);

  return {
    marketingSummary: marketingResult.status === 'fulfilled' ? marketingResult.value : DEFAULT_MARKETING_SUMMARY,
    analyticsSummary: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
}

export async function loadCommsTemplatesTab() {
  const [header, templatesResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listEmailTemplates()]).then(([r]) => r),
  ]);

  return {
    ...header,
    templates: templatesResult.status === 'fulfilled' ? templatesResult.value : [],
  };
}

export async function loadCommsAutomationsTab() {
  const [header, automationsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listAutomations()]).then(([r]) => r),
  ]);

  return {
    ...header,
    automations: automationsResult.status === 'fulfilled' ? automationsResult.value : [],
  };
}

export async function loadCommsBulkSendsTab() {
  const [header, bulkSendsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listBulkLeadEmailSendJobs()]).then(([r]) => r),
  ]);

  return {
    ...header,
    bulkSendJobs: bulkSendsResult.status === 'fulfilled' ? bulkSendsResult.value : [],
    bulkSendJobsError:
      bulkSendsResult.status === 'rejected'
        ? rejectedErrorMessage(bulkSendsResult.reason, 'Failed to load bulk send jobs.')
        : null,
  };
}

export async function loadCommsPerformanceTab() {
  const [header, analyticsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([getCommsAnalytics()]).then(([r]) => r),
  ]);

  return {
    ...header,
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
}
