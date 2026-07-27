'use client';

import { Mail, MessageCircle, Plus, RefreshCw, Send, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { syncWhatsAppTemplatesAction } from '@/app/(crm)/communications/actions';
import { BulkSendListRow } from '@/components/comms/bulk-send-list-row';
import { CommsHeaderStats } from '@/components/comms/comms-header-stats';
import { CommsPerformancePanel } from '@/components/comms/comms-performance-panel';
import { AutomationListRow } from '@/components/comms/automation-list-row';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import {
  COMMS_CHANNELS,
  COMMS_TABS,
  commsAutomationHref,
  commsTabHref,
  commsTemplateHref,
  type CommsChannel,
  type CommsTab,
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
  WhatsAppTemplate,
} from '@/utils/api';

type CommunicationsViewProps = {
  channel?: CommsChannel;
  templates?: EmailTemplate[] | WhatsAppTemplate[];
  automations?: Automation[];
  bulkSendJobs?: BulkLeadEmailSendJob[] | BulkLeadWhatsAppSendJob[];
  bulkSendJobsError?: string | null;
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
  analytics?: CommsAnalytics | null;
  tab: CommsTab;
};

export function CommunicationsView({
  channel = 'email',
  templates = [],
  automations = [],
  bulkSendJobs = [],
  bulkSendJobsError,
  marketingSummary,
  analyticsSummary,
  analytics = null,
  tab,
}: CommunicationsViewProps) {
  const router = useRouter();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, startSync] = useTransition();
  const activeAutomationCount = analyticsSummary?.activeAutomations ?? 0;
  const isWhatsApp = channel === 'whatsapp';

  const selectChannel = (next: CommsChannel) => {
    router.push(commsTabHref(next, tab));
  };

  const selectTab = (next: CommsTab) => {
    router.push(commsTabHref(channel, next));
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

  return (
    <CrmPageLayout className="gap-4">
      <CommsHeaderStats
        marketingSummary={marketingSummary}
        analytics={analyticsSummary}
        activeAutomationCount={activeAutomationCount}
        onOpenPerformance={() => selectTab('performance')}
      />

      <div className="flex flex-wrap gap-2">
        {COMMS_CHANNELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectChannel(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              channel === id ? 'bg-brand text-white' : 'border border-slate-100 bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {COMMS_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === id ? 'bg-brand text-white' : 'border border-slate-100 bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'templates' ? (
        <Card>
          <SectionHead
            title={isWhatsApp ? 'WhatsApp templates' : 'Email templates'}
            right={
              <div className="flex flex-wrap items-center gap-2">
                {isWhatsApp ? (
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
                <Link
                  href={commsTemplateHref(channel, 'new')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New template
                </Link>
              </div>
            }
          />
          {syncMessage ? <p className="mb-3 text-sm font-medium text-slate-600">{syncMessage}</p> : null}
          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500">
                No templates yet. Create your first {isWhatsApp ? 'WhatsApp' : 'email'} template.
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
                        template.status === 'active' ? 'success' : template.status === 'archived' ? 'neutral' : 'warn'
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
        </Card>
      ) : null}

      {tab === 'automations' ? (
        <Card>
          <SectionHead
            title="Automations"
            subtitle={
              isWhatsApp
                ? 'Delay-based nurture workflows with WhatsApp sends'
                : 'Delay-based nurture workflows with conditions'
            }
            right={
              <Link
                href={commsAutomationHref(channel, 'new')}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                New automation
              </Link>
            }
          />
          <div className="flex flex-col gap-2">
            {automations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Workflow className="h-5 w-5" />
                </div>
                <p className="max-w-md text-sm font-medium text-slate-600">
                  Build visual nurture flows — wait, check conditions, send{' '}
                  {isWhatsApp ? 'WhatsApp messages' : 'emails'} — triggered when leads are created or start checkout.
                </p>
              </div>
            ) : (
              automations.map((automation) => (
                <AutomationListRow key={automation.id} automation={automation} channel={channel} />
              ))
            )}
          </div>
        </Card>
      ) : null}

      {tab === 'bulk-sends' ? (
        <Card>
          <SectionHead
            title="Bulk sends"
            subtitle="Campaign sends from Lead Database"
            right={
              <Link
                href="/database"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <Send className="h-3.5 w-3.5" />
                Send from Lead Database
              </Link>
            }
          />
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
        </Card>
      ) : null}

      {tab === 'performance' ? (
        analytics ? (
          <CommsPerformancePanel analytics={analytics} />
        ) : (
          <Card>
            <SectionHead title="Performance" subtitle="Delivery and engagement tracking" />
            <p className="text-sm text-slate-500">
              Analytics could not be loaded. Apply the latest backend migration and ensure the API is running.
            </p>
          </Card>
        )
      ) : null}
    </CrmPageLayout>
  );
}
