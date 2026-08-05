'use client';

import type { LucideIcon } from 'lucide-react';
import { Mail, MessageCircle, Plus, RefreshCw, Send, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { syncWhatsAppTemplatesAction } from '@/app/(crm)/communications/actions';
import { BulkSendListRow } from '@/components/comms/bulk-send-list-row';
import { CommsHeaderStats } from '@/components/comms/comms-header-stats';
import { CommsPerformancePanel } from '@/components/comms/comms-performance-panel';
import { WhatsAppCommsPerformancePanel } from '@/components/comms/whatsapp-comms-performance-panel';
import { WhatsAppSendsPanel } from '@/components/comms/whatsapp-sends-panel';
import { AutomationListRow } from '@/components/comms/automation-list-row';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { cn } from '@/lib/cn';
import {
  COMMS_AUTOMATIONS_HREF,
  COMMS_CHANNEL_TABS,
  COMMS_CHANNELS,
  COMMS_WHATSAPP_CHANNEL_TABS,
  commsAutomationHref,
  commsTabHref,
  commsTemplateHref,
  type CommsChannel,
  type CommsChannelTab,
  type CommsSection,
} from '@/lib/comms-channel';
import {
  whatsAppTemplateCategoryLabel,
  whatsAppTemplateStatusLabel,
  whatsAppTemplateStatusTone,
} from '@/lib/whatsapp-template-types';
import type {
  Automation,
  BulkLeadEmailSendJob,
  BulkLeadWhatsAppSendJob,
  CommsAnalytics,
  CommsAnalyticsSummary,
  EmailTemplate,
  MarketingContactsSummary,
  WhatsAppFlags,
  WhatsAppTemplate,
  WhatsAppCommsAnalytics,
  WhatsAppSend,
} from '@/utils/api';

type CommunicationsViewProps = {
  section: CommsSection;
  tab?: CommsChannelTab;
  templates?: EmailTemplate[] | WhatsAppTemplate[];
  automations?: Automation[];
  bulkSendJobs?: BulkLeadEmailSendJob[] | BulkLeadWhatsAppSendJob[];
  bulkSendJobsError?: string | null;
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
  analytics?: CommsAnalytics | null;
  whatsAppAnalytics?: WhatsAppCommsAnalytics | null;
  whatsAppSends?: WhatsAppSend[];
  whatsAppSendsError?: string | null;
  whatsappFlags?: WhatsAppFlags;
};

type CommsNavTone = 'violet' | 'indigo' | 'green';

const COMMS_NAV_ACTIVE_TAB: Record<CommsNavTone, string> = {
  violet: 'bg-violet-600 text-white shadow-sm',
  indigo: 'bg-indigo-600 text-white shadow-sm',
  green: 'bg-emerald-600 text-white shadow-sm',
};

function commsNavTabClass(active: boolean, tone: CommsNavTone): string {
  return cn(
    'cursor-pointer rounded-[14px] px-3 py-1.5 text-[12px] font-semibold transition-colors',
    active ? COMMS_NAV_ACTIVE_TAB[tone] : 'text-slate-600 hover:bg-slate-100'
  );
}

function CommsNavLabelRail({
  label,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  icon: LucideIcon;
  tone: CommsNavTone;
  href: string;
}) {
  const toneClass: Record<CommsNavTone, string> = {
    violet: 'text-violet-600',
    indigo: 'text-indigo-600',
    green: 'text-emerald-600',
  };

  const hoverClass: Record<CommsNavTone, string> = {
    violet: 'hover:bg-violet-50',
    indigo: 'hover:bg-indigo-50',
    green: 'hover:bg-emerald-50',
  };

  return (
    <Link
      href={href}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 self-stretch rounded-l-lg border-r border-slate-200 py-1 pr-3 pl-3 transition-colors',
        hoverClass[tone]
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', toneClass[tone])} />
      <span
        className={cn(
          'text-[10px] leading-none font-bold tracking-[0.12em] whitespace-nowrap uppercase',
          toneClass[tone]
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function CommsNavSectionPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-10 items-center rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CommunicationsView({
  section,
  tab = 'templates',
  templates = [],
  automations = [],
  bulkSendJobs = [],
  bulkSendJobsError,
  marketingSummary,
  analyticsSummary,
  analytics = null,
  whatsAppAnalytics = null,
  whatsAppSends = [],
  whatsAppSendsError,
  whatsappFlags,
}: CommunicationsViewProps) {
  const router = useRouter();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, startSync] = useTransition();
  const activeAutomationCount = analyticsSummary?.activeAutomations ?? 0;
  const isAutomations = section === 'automations';
  const channel = isAutomations ? 'email' : section;
  const isWhatsApp = channel === 'whatsapp';
  const canSyncWhatsAppTemplates = whatsappFlags?.sendsEnabled ?? false;
  const canManageWhatsAppTemplates = whatsappFlags?.templatesEnabled ?? false;

  const selectChannelTab = (nextChannel: CommsChannel, nextTab: CommsChannelTab) => {
    router.push(commsTabHref(nextChannel, nextTab));
  };

  const handleSyncTemplates = () => {
    setSyncMessage(null);
    startSync(async () => {
      try {
        const result = await syncWhatsAppTemplatesAction();
        setSyncMessage(`Synced ${result.synced} template${result.synced === 1 ? '' : 's'} from Convonite.`);
        router.refresh();
      } catch (error) {
        setSyncMessage(error instanceof Error ? error.message : 'Failed to sync templates.');
      }
    });
  };

  const performanceHref = commsTabHref(isWhatsApp ? 'whatsapp' : 'email', 'performance');

  const contentTitle = isAutomations
    ? 'Automations'
    : tab === 'templates'
      ? 'Templates'
      : tab === 'bulk-sends'
        ? 'Bulk sends'
        : tab === 'sends'
          ? 'Sends'
          : 'Performance';

  const contentSubtitle = isAutomations
    ? 'Delay-based nurture workflows with email and WhatsApp sends'
    : isWhatsApp
      ? tab === 'templates'
        ? 'WhatsApp message templates'
        : tab === 'bulk-sends'
          ? 'Campaign sends from Lead Database'
          : tab === 'sends'
            ? 'Global send log for all WhatsApp messages'
            : 'WhatsApp delivery and engagement'
      : tab === 'templates'
        ? 'Email layouts and subjects'
        : tab === 'bulk-sends'
          ? 'Campaign sends from Lead Database'
          : 'Delivery and engagement tracking';

  return (
    <CrmPageLayout className="gap-4">
      <CommsHeaderStats
        marketingSummary={marketingSummary}
        analytics={analyticsSummary}
        activeAutomationCount={activeAutomationCount}
        onOpenPerformance={() => router.push(performanceHref)}
      />

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-slate-200/90 bg-linear-to-r from-violet-100 via-indigo-100/80 to-emerald-100 px-4 py-3.5">
          <div className="relative flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-stretch">
            <div className="w-full xl:w-auto">
              <CommsNavSectionPanel className="w-full xl:w-auto">
                <div className="flex w-full items-center gap-3 xl:w-auto">
                  <CommsNavLabelRail label="Automations" icon={Workflow} tone="violet" href={COMMS_AUTOMATIONS_HREF} />
                  <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 p-0.5">
                    <Link href={COMMS_AUTOMATIONS_HREF} className={commsNavTabClass(isAutomations, 'violet')}>
                      Workflows
                    </Link>
                  </div>
                </div>
              </CommsNavSectionPanel>
            </div>

            {COMMS_CHANNELS.map(({ id: channelId, label }) => {
              const ChannelIcon = channelId === 'whatsapp' ? MessageCircle : Mail;
              const tone: CommsNavTone = channelId === 'whatsapp' ? 'green' : 'indigo';

              return (
                <div key={channelId} className="w-full xl:w-auto">
                  <CommsNavSectionPanel className="w-full xl:w-auto">
                    <div className="flex w-full items-center gap-3 xl:w-auto">
                      <CommsNavLabelRail
                        label={label}
                        icon={ChannelIcon}
                        tone={tone}
                        href={commsTabHref(channelId, COMMS_CHANNEL_TABS[0].id)}
                      />
                      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 p-0.5">
                        {(channelId === 'whatsapp' ? COMMS_WHATSAPP_CHANNEL_TABS : COMMS_CHANNEL_TABS).map(
                          ({ id: tabId, label: tabLabel }) => (
                            <button
                              key={tabId}
                              type="button"
                              onClick={() => selectChannelTab(channelId, tabId)}
                              className={commsNavTabClass(section === channelId && tab === tabId, tone)}
                            >
                              {tabLabel}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </CommsNavSectionPanel>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-7">
          <SectionHead
            className="mb-5"
            title={contentTitle}
            subtitle={contentSubtitle}
            right={
              isAutomations ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => router.push(commsAutomationHref('new'))}
                >
                  New automation
                </Button>
              ) : tab === 'templates' ? (
                <div className="flex flex-wrap items-center gap-2">
                  {isWhatsApp && canSyncWhatsAppTemplates ? (
                    <Button
                      variant="light"
                      size="sm"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      loading={isSyncing}
                      loadingLabel="Syncing…"
                      onClick={handleSyncTemplates}
                    >
                      Sync from Convonite
                    </Button>
                  ) : null}
                  {isWhatsApp && !canManageWhatsAppTemplates ? null : (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => router.push(commsTemplateHref(channel, 'new'))}
                    >
                      New template
                    </Button>
                  )}
                </div>
              ) : tab === 'bulk-sends' ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  onClick={() => router.push('/database')}
                >
                  Send from Lead Database
                </Button>
              ) : null
            }
          />

          {isAutomations ? (
            <div className="flex flex-col gap-2">
              {automations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <p className="max-w-md text-sm font-medium text-slate-600">
                    Build visual nurture flows — wait, check conditions, send email or WhatsApp — triggered when leads
                    are created or start checkout.
                  </p>
                </div>
              ) : (
                automations.map((automation) => <AutomationListRow key={automation.id} automation={automation} />)
              )}
            </div>
          ) : null}

          {!isAutomations && tab === 'templates' ? (
            <>
              {syncMessage ? <p className="mb-3 text-sm font-medium text-slate-600">{syncMessage}</p> : null}
              <div className="flex flex-col gap-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No templates yet.
                    {isWhatsApp && !canSyncWhatsAppTemplates
                      ? ' Enable WHATSAPP_SENDS_ENABLED on the backend to load and sync templates.'
                      : isWhatsApp
                        ? ' Use Sync from Convonite to import templates.'
                        : ' Create your first email template.'}
                  </p>
                ) : isWhatsApp ? (
                  (templates as WhatsAppTemplate[]).map((template) => (
                    <Link
                      key={template.id}
                      href={commsTemplateHref(channel, template.id)}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 transition hover:border-brand/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{template.name}</p>
                          <p className="truncate text-xs font-medium text-slate-500">
                            {template.language} · {whatsAppTemplateCategoryLabel(template.category)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone="neutral">{template.purpose === 'broadcast' ? 'Broadcast' : 'Individual'}</Pill>
                        <Pill tone={whatsAppTemplateStatusTone(template.status)}>
                          {whatsAppTemplateStatusLabel(template.status)}
                        </Pill>
                      </div>
                    </Link>
                  ))
                ) : (
                  (templates as EmailTemplate[]).map((template) => (
                    <Link
                      key={template.id}
                      href={commsTemplateHref(channel, template.id)}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 transition hover:border-brand/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{template.name}</p>
                          <p className="truncate text-xs font-medium text-slate-500">
                            {template.subject || 'No subject yet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone={template.classification === 'marketing' ? 'brand' : 'neutral'}>
                          {template.classification === 'marketing' ? 'Marketing' : 'Transactional'}
                        </Pill>
                        <Pill
                          tone={
                            template.status === 'active'
                              ? 'success'
                              : template.status === 'archived'
                                ? 'neutral'
                                : 'warn'
                          }
                        >
                          {template.status === 'active'
                            ? 'Active'
                            : template.status === 'archived'
                              ? 'Archived'
                              : 'Unpublished'}
                        </Pill>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </>
          ) : null}

          {!isAutomations && tab === 'bulk-sends' ? (
            <div className="flex flex-col gap-2">
              {bulkSendJobsError ? (
                <p className="text-sm font-medium text-danger-press">{bulkSendJobsError}</p>
              ) : bulkSendJobs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No bulk sends yet. Select leads in Lead Database and use Send {isWhatsApp ? 'WhatsApp' : 'email'} to
                  start a campaign.
                </p>
              ) : (
                bulkSendJobs.map((job) => <BulkSendListRow key={job.id} job={job} channel={channel} />)
              )}
            </div>
          ) : null}

          {!isAutomations && tab === 'performance' ? (
            isWhatsApp ? (
              whatsAppAnalytics ? (
                <WhatsAppCommsPerformancePanel analytics={whatsAppAnalytics} />
              ) : (
                <p className="text-sm text-slate-500">
                  Analytics could not be loaded. Ensure WhatsApp sends are enabled and the API is running.
                </p>
              )
            ) : analytics ? (
              <CommsPerformancePanel analytics={analytics} />
            ) : (
              <p className="text-sm text-slate-500">
                Analytics could not be loaded. Apply the latest backend migration and ensure the API is running.
              </p>
            )
          ) : null}

          {!isAutomations && isWhatsApp && tab === 'sends' ? (
            whatsAppSendsError ? (
              <p className="text-sm font-medium text-danger-press">{whatsAppSendsError}</p>
            ) : (
              <WhatsAppSendsPanel initialSends={whatsAppSends} />
            )
          ) : null}
        </div>
      </Card>
    </CrmPageLayout>
  );
}
