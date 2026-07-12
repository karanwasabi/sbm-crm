'use client';

import { Mail, Plus, Send, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BulkSendListRow } from '@/components/comms/bulk-send-list-row';
import { CommsHeaderStats } from '@/components/comms/comms-header-stats';
import { CommsPerformancePanel } from '@/components/comms/comms-performance-panel';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { Pill } from '@/components/ui/pill';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { AutomationListRow } from '@/components/comms/automation-list-row';
import type {
  Automation,
  BulkLeadEmailSendJob,
  CommsAnalytics,
  CommsAnalyticsSummary,
  EmailTemplate,
  MarketingContactsSummary,
} from '@/utils/api';

export type CommsTab = 'templates' | 'automations' | 'bulk-sends' | 'performance';

const COMMS_TABS: { id: CommsTab; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'automations', label: 'Automations' },
  { id: 'bulk-sends', label: 'Bulk sends' },
  { id: 'performance', label: 'Performance' },
];

const COMMS_TAB_HREF: Record<CommsTab, string> = {
  templates: '/communications/templates',
  automations: '/communications/automations',
  'bulk-sends': '/communications/bulk-sends',
  performance: '/communications/performance',
};

type CommunicationsViewProps = {
  templates?: EmailTemplate[];
  automations?: Automation[];
  bulkSendJobs?: BulkLeadEmailSendJob[];
  bulkSendJobsError?: string | null;
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
  analytics?: CommsAnalytics | null;
  tab: CommsTab;
};

export function CommunicationsView({
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
  const activeAutomationCount = analyticsSummary?.activeAutomations ?? 0;

  const selectTab = (next: CommsTab) => {
    router.push(COMMS_TAB_HREF[next]);
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
            title="Email templates"
            right={
              <Link
                href="/communications/templates/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                New template
              </Link>
            }
          />
          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500">No templates yet. Create your first email template.</p>
            ) : (
              templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/communications/templates/${template.id}`}
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
            subtitle="Delay-based nurture workflows with conditions"
            right={
              <Link
                href="/communications/automations/new"
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
                  Build visual nurture flows — wait, check conditions, send emails — triggered when leads are created or
                  start checkout.
                </p>
              </div>
            ) : (
              automations.map((automation) => <AutomationListRow key={automation.id} automation={automation} />)
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
                No bulk sends yet. Select leads in Lead Database and use Send email to start a campaign.
              </p>
            ) : (
              bulkSendJobs.map((job) => <BulkSendListRow key={job.id} job={job} />)
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
