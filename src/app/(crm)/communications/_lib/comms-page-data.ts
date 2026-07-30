import {
  ApiError,
  getCommsAnalytics,
  getCommsAnalyticsSummary,
  getMarketingContactsSummary,
  getWhatsAppFlags,
  listAutomations,
  listBulkLeadEmailSendJobs,
  listBulkLeadWhatsAppSendJobs,
  listEmailTemplates,
  listWhatsAppTemplates,
  type CommsAnalyticsSummary,
  type MarketingContactsSummary,
  type WhatsAppFlags,
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

const DEFAULT_WHATSAPP_FLAGS: WhatsAppFlags = {
  templatesEnabled: false,
  sendsEnabled: false,
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
  const [header, templatesResult, flagsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([channel === 'whatsapp' ? listWhatsAppTemplates() : listEmailTemplates()]).then(([r]) => r),
    channel === 'whatsapp'
      ? Promise.allSettled([getWhatsAppFlags()]).then(([r]) => r)
      : Promise.resolve({ status: 'fulfilled' as const, value: DEFAULT_WHATSAPP_FLAGS }),
  ]);

  return {
    section: channel as CommsChannel,
    tab: 'templates' as const,
    ...header,
    templates: templatesResult.status === 'fulfilled' ? templatesResult.value : [],
    whatsappFlags: flagsResult.status === 'fulfilled' ? flagsResult.value : DEFAULT_WHATSAPP_FLAGS,
  };
}

export async function loadCommsAutomationsTab() {
  const [header, automationsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listAutomations()]).then(([r]) => r),
  ]);

  return {
    section: 'automations' as const,
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
    section: channel as CommsChannel,
    tab: 'bulk-sends' as const,
    ...header,
    bulkSendJobs: bulkSendsResult.status === 'fulfilled' ? bulkSendsResult.value : [],
    bulkSendJobsError:
      bulkSendsResult.status === 'rejected'
        ? rejectedErrorMessage(bulkSendsResult.reason, 'Failed to load bulk send jobs.')
        : null,
  };
}

export async function loadCommsPerformanceTab(channel: CommsChannel = 'email') {
  const header = await loadCommsHeaderData();

  if (channel === 'whatsapp') {
    return {
      section: 'whatsapp' as const,
      tab: 'performance' as const,
      ...header,
      analytics: null,
    };
  }

  const analyticsResult = await Promise.allSettled([getCommsAnalytics()]).then(([r]) => r);

  return {
    section: 'email' as const,
    tab: 'performance' as const,
    ...header,
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
}
