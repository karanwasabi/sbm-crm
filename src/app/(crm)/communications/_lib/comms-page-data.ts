import {
  ApiError,
  getCommsAnalytics,
  getCommsAnalyticsSummary,
  getMarketingContactsSummary,
  listAutomations,
  listBulkLeadEmailSendJobs,
  listBulkLeadWhatsAppSendJobs,
  listEmailTemplates,
  listWhatsAppTemplates,
  type CommsAnalyticsSummary,
  type MarketingContactsSummary,
} from '@/utils/api';
import type { CommsChannel } from '@/lib/comms-channel';

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

export async function loadCommsTemplatesTab(channel: CommsChannel = 'email') {
  const [header, templatesResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([channel === 'whatsapp' ? listWhatsAppTemplates() : listEmailTemplates()]).then(([r]) => r),
  ]);

  return {
    channel,
    ...header,
    templates: templatesResult.status === 'fulfilled' ? templatesResult.value : [],
  };
}

export async function loadCommsAutomationsTab(channel: CommsChannel = 'email') {
  const [header, automationsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listAutomations(channel)]).then(([r]) => r),
  ]);

  return {
    channel,
    ...header,
    automations: automationsResult.status === 'fulfilled' ? automationsResult.value : [],
  };
}

export async function loadCommsBulkSendsTab(channel: CommsChannel = 'email') {
  const [header, bulkSendsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([channel === 'whatsapp' ? listBulkLeadWhatsAppSendJobs() : listBulkLeadEmailSendJobs()]).then(
      ([r]) => r
    ),
  ]);

  return {
    channel,
    ...header,
    bulkSendJobs: bulkSendsResult.status === 'fulfilled' ? bulkSendsResult.value : [],
    bulkSendJobsError:
      bulkSendsResult.status === 'rejected'
        ? rejectedErrorMessage(bulkSendsResult.reason, 'Failed to load bulk send jobs.')
        : null,
  };
}

export async function loadCommsPerformanceTab(channel: CommsChannel = 'email') {
  const [header, analyticsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([getCommsAnalytics()]).then(([r]) => r),
  ]);

  return {
    channel,
    ...header,
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
}
