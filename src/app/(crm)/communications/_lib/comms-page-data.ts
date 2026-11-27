import { cache } from 'react';
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
  type EmailTemplate,
  type MarketingContactsSummary,
  type WhatsAppAccount,
  type WhatsAppCommsAnalytics,
  type WhatsAppFlags,
  type WhatsAppTemplate,
} from '@/utils/api';
import type { CommsChannel } from '@/lib/comms-channel';
import {
  buildCommsTemplatesApiQuery,
  parseCommsTemplateFilters,
  type CommsTemplateFilters,
} from '@/lib/comms-templates-query';
import { resolveWhatsAppAccountId } from '@/lib/whatsapp-account';

type TemplatesPageResult = {
  items: EmailTemplate[] | WhatsAppTemplate[];
  total: number;
};

function rejectedErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError) {
    return reason.message;
  }
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }
  return fallback;
}

export const DEFAULT_MARKETING_SUMMARY: MarketingContactsSummary = {
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

export type CommsHeaderData = {
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
};

export const loadCommsHeaderData = cache(async (): Promise<CommsHeaderData> => {
  const [marketingResult, analyticsResult] = await Promise.allSettled([
    getMarketingContactsSummary(),
    getCommsAnalyticsSummary(),
  ]);

  return {
    marketingSummary: marketingResult.status === 'fulfilled' ? marketingResult.value : DEFAULT_MARKETING_SUMMARY,
    analyticsSummary: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
  };
});

export async function loadCommsTemplatesTab(
  channel: CommsChannel = 'email',
  searchParams: Record<string, string | string[] | undefined> = {}
) {
  const filters = parseCommsTemplateFilters(channel, searchParams);
  const accountFromUrl = channel === 'whatsapp' ? filters.accountId : '';

  const flagsPromise =
    channel === 'whatsapp'
      ? Promise.allSettled([getWhatsAppFlags()]).then(([r]) => r)
      : Promise.resolve({ status: 'fulfilled' as const, value: DEFAULT_WHATSAPP_FLAGS });

  const accountsPromise =
    channel === 'whatsapp'
      ? Promise.allSettled([listWhatsAppAccounts()]).then(([r]) => r)
      : Promise.resolve({ status: 'fulfilled' as const, value: null });

  let whatsAppAccounts: WhatsAppAccount[] = [];
  let whatsAppDefaultAccountId = '';
  let whatsAppAccountLocked = false;
  let selectedWhatsAppAccountId = accountFromUrl;
  let resolvedFilters: CommsTemplateFilters = filters;

  // When wa_account is already in the URL, fetch templates immediately — do not
  // wait on the accounts list (still load accounts in parallel for the picker).
  if (channel === 'whatsapp' && accountFromUrl) {
    const apiQuery = buildCommsTemplatesApiQuery(resolvedFilters);
    const [templatesResult, flagsResult, accountsResult] = await Promise.all([
      Promise.allSettled([listWhatsAppTemplatesPaged(apiQuery)]).then(([r]) => r),
      flagsPromise,
      accountsPromise,
    ]);

    if (accountsResult.status === 'fulfilled' && accountsResult.value) {
      whatsAppAccounts = accountsResult.value.accounts;
      whatsAppDefaultAccountId = accountsResult.value.defaultAccountId;
      whatsAppAccountLocked = accountsResult.value.accountLocked;
      selectedWhatsAppAccountId = resolveWhatsAppAccountId(accountFromUrl, whatsAppAccounts, whatsAppDefaultAccountId);
      resolvedFilters = { ...filters, accountId: selectedWhatsAppAccountId };

      // Rare: URL account was invalid and resolver picked another — refetch once.
      if (selectedWhatsAppAccountId && selectedWhatsAppAccountId !== accountFromUrl) {
        const correctedQuery = buildCommsTemplatesApiQuery(resolvedFilters);
        const corrected = await Promise.allSettled([listWhatsAppTemplatesPaged(correctedQuery)]).then(([r]) => r);
        return buildTemplatesTabResult({
          channel,
          resolvedFilters,
          templatesResult: corrected,
          flagsResult,
          whatsAppAccounts,
          whatsAppDefaultAccountId,
          whatsAppAccountLocked,
          selectedWhatsAppAccountId,
        });
      }
    }

    return buildTemplatesTabResult({
      channel,
      resolvedFilters,
      templatesResult,
      flagsResult,
      whatsAppAccounts,
      whatsAppDefaultAccountId,
      whatsAppAccountLocked,
      selectedWhatsAppAccountId,
    });
  }

  const [flagsResult, accountsResult] = await Promise.all([flagsPromise, accountsPromise]);

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

  return buildTemplatesTabResult({
    channel,
    resolvedFilters,
    templatesResult,
    flagsResult,
    whatsAppAccounts,
    whatsAppDefaultAccountId,
    whatsAppAccountLocked,
    selectedWhatsAppAccountId,
  });
}

function buildTemplatesTabResult({
  channel,
  resolvedFilters,
  templatesResult,
  flagsResult,
  whatsAppAccounts,
  whatsAppDefaultAccountId,
  whatsAppAccountLocked,
  selectedWhatsAppAccountId,
}: {
  channel: CommsChannel;
  resolvedFilters: CommsTemplateFilters;
  templatesResult: PromiseSettledResult<TemplatesPageResult>;
  flagsResult: PromiseSettledResult<WhatsAppFlags>;
  whatsAppAccounts: WhatsAppAccount[];
  whatsAppDefaultAccountId: string;
  whatsAppAccountLocked: boolean;
  selectedWhatsAppAccountId: string;
}) {
  if (templatesResult.status === 'rejected') {
    return {
      section: channel as CommsChannel,
      tab: 'templates' as const,
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
  if (channel === 'whatsapp') {
    const [header, analyticsResult] = await Promise.all([
      loadCommsHeaderData(),
      Promise.allSettled([getWhatsAppCommsAnalytics()]).then(([r]) => r),
    ]);
    return {
      section: 'whatsapp' as const,
      tab: 'performance' as const,
      ...header,
      whatsAppAnalytics:
        analyticsResult.status === 'fulfilled' ? analyticsResult.value : (null as WhatsAppCommsAnalytics | null),
    };
  }

  const [header, analyticsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([getCommsAnalytics()]).then(([r]) => r),
  ]);

  return {
    section: 'email' as const,
    tab: 'performance' as const,
    ...header,
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
    whatsAppAnalytics: null as WhatsAppCommsAnalytics | null,
  };
}

export async function loadCommsSendsTab() {
  const [header, sendsResult] = await Promise.all([
    loadCommsHeaderData(),
    Promise.allSettled([listWhatsAppSends({ limit: 50, offset: 0 })]).then(([r]) => r),
  ]);

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
