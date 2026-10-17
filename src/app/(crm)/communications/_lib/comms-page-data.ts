import {
  ApiError,
  getCommsAnalytics,
  getCommsAnalyticsSummary,
  getMarketingContactsSummary,
  getWhatsAppCommsAnalytics,
  getWhatsAppFlags,
  listAutomations,
  listBulkLeadEmailSendJobs,
  listBulkLeadWhatsAppSendJobs,
  listEmailTemplatesPaged,
  listWhatsAppSends,
  listWhatsAppAccounts,
  listWhatsAppTemplatesPaged,
  type CommsAnalyticsSummary,
  type MarketingContactsSummary,
  type WhatsAppCommsAnalytics,
  type WhatsAppFlags,
} from '@/utils/api';
import type { CommsChannel } from '@/lib/comms-channel';
import {
  buildCommsTemplatesApiQuery,
  parseCommsTemplateFilters,
  type CommsTemplateFilters,
} from '@/lib/comms-templates-query';
import { resolveWhatsAppAccountId } from '@/lib/whatsapp-account';
import type { WhatsAppAccount } from '@/utils/api';

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

export async function loadCommsTemplatesTab(
  channel: CommsChannel = 'email',
  searchParams: Record<string, string | string[] | undefined> = {}
) {
  const filters = parseCommsTemplateFilters(channel, searchParams);

  const [header, flagsResult, accountsResult] = await Promise.all([
    loadCommsHeaderData(),
    channel === 'whatsapp'
      ? Promise.allSettled([getWhatsAppFlags()]).then(([r]) => r)
      : Promise.resolve({ status: 'fulfilled' as const, value: DEFAULT_WHATSAPP_FLAGS }),
    channel === 'whatsapp'
      ? Promise.allSettled([listWhatsAppAccounts()]).then(([r]) => r)
      : Promise.resolve({ status: 'fulfilled' as const, value: null }),
  ]);

  let whatsAppAccounts: WhatsAppAccount[] = [];
  let whatsAppDefaultAccountId = '';
  let whatsAppAccountLocked = false;
  let selectedWhatsAppAccountId = '';
  let resolvedFilters: CommsTemplateFilters = filters;

  if (channel === 'whatsapp' && accountsResult.status === 'fulfilled' && accountsResult.value) {
    whatsAppAccounts = accountsResult.value.accounts;
    whatsAppDefaultAccountId = accountsResult.value.defaultAccountId;
    whatsAppAccountLocked = accountsResult.value.accountLocked;
    selectedWhatsAppAccountId = resolveWhatsAppAccountId(
      filters.accountId || undefined,
      whatsAppAccounts,
      whatsAppDefaultAccountId
    );
    resolvedFilters = { ...filters, accountId: selectedWhatsAppAccountId };
  }

  const apiQuery = buildCommsTemplatesApiQuery(resolvedFilters);
  const templatesResult = await Promise.allSettled([
    channel === 'whatsapp' ? listWhatsAppTemplatesPaged(apiQuery) : listEmailTemplatesPaged(apiQuery),
  ]).then(([r]) => r);

  if (templatesResult.status === 'rejected') {
    return {
      section: channel as CommsChannel,
      tab: 'templates' as const,
      ...header,
      templates: [],
      templatesTotal: 0,
      templateFilters: resolvedFilters,
      templatesError: rejectedErrorMessage(templatesResult.reason, 'Failed to load templates.'),
      whatsappFlags: flagsResult.status === 'fulfilled' ? flagsResult.value : DEFAULT_WHATSAPP_FLAGS,
      whatsAppAccounts,
      whatsAppDefaultAccountId,
      whatsAppAccountLocked,
      selectedWhatsAppAccountId,
    };
  }

  const page = templatesResult.value;

  return {
    section: channel as CommsChannel,
    tab: 'templates' as const,
    ...header,
    templates: page.items,
    templatesTotal: page.total,
    templateFilters: resolvedFilters,
    templatesError: null as string | null,
    whatsappFlags: flagsResult.status === 'fulfilled' ? flagsResult.value : DEFAULT_WHATSAPP_FLAGS,
    whatsAppAccounts,
    whatsAppDefaultAccountId,
    whatsAppAccountLocked,
    selectedWhatsAppAccountId,
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
    const analyticsResult = await Promise.allSettled([getWhatsAppCommsAnalytics()]).then(([r]) => r);
    return {
      section: 'whatsapp' as const,
      tab: 'performance' as const,
      ...header,
      whatsAppAnalytics:
        analyticsResult.status === 'fulfilled' ? analyticsResult.value : (null as WhatsAppCommsAnalytics | null),
    };
  }

  const analyticsResult = await Promise.allSettled([getCommsAnalytics()]).then(([r]) => r);

  return {
    section: 'email' as const,
    tab: 'performance' as const,
    ...header,
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
    whatsAppAnalytics: null as WhatsAppCommsAnalytics | null,
  };
}

export async function loadCommsSendsTab() {
  const header = await loadCommsHeaderData();
  const sendsResult = await Promise.allSettled([listWhatsAppSends({ limit: 50, offset: 0 })]).then(([r]) => r);

  return {
    section: 'whatsapp' as const,
    tab: 'sends' as const,
    ...header,
    whatsAppSends: sendsResult.status === 'fulfilled' ? sendsResult.value : [],
    whatsAppSendsError:
      sendsResult.status === 'rejected'
        ? rejectedErrorMessage(sendsResult.reason, 'Failed to load WhatsApp sends.')
        : null,
  };
}
