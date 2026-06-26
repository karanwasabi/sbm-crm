'use client';

import { Mail, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { MarketingCapMeter } from '@/components/comms/marketing-cap-meter';
import { CommsPerformancePanel } from '@/components/comms/comms-performance-panel';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { Pill } from '@/components/ui/pill';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { TRIGGER_LABELS } from '@/lib/automation-types';
import type { Automation, CommsAnalytics, EmailTemplate, MarketingContactsSummary } from '@/utils/api';

type CommunicationsViewProps = {
  templates: EmailTemplate[];
  automations: Automation[];
  marketingSummary: MarketingContactsSummary;
  analytics: CommsAnalytics | null;
};

export function CommunicationsView({ templates, automations, marketingSummary, analytics }: CommunicationsViewProps) {
  const [tab, setTab] = useState<'templates' | 'automations' | 'performance'>('templates');

  return (
    <CrmPageLayout className="gap-4">
      <MarketingCapMeter summary={marketingSummary} />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['templates', 'Templates'],
            ['automations', 'Automations'],
            ['performance', 'Performance'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
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
            subtitle="MJML designer with variables"
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
              automations.map((automation) => (
                <Link
                  key={automation.id}
                  href={`/communications/automations/${automation.id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3 transition hover:border-brand/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{automation.name}</p>
                      <p className="truncate text-xs font-medium text-slate-500">
                        {TRIGGER_LABELS[automation.triggerType]} · v{automation.graphVersion}
                      </p>
                    </div>
                  </div>
                  <Pill
                    tone={
                      automation.status === 'active'
                        ? 'success'
                        : automation.status === 'paused'
                          ? 'warn'
                          : automation.status === 'archived'
                            ? 'neutral'
                            : 'brand'
                    }
                  >
                    {automation.status === 'active'
                      ? 'Active'
                      : automation.status === 'paused'
                        ? 'Paused'
                        : automation.status === 'archived'
                          ? 'Archived'
                          : 'Draft'}
                  </Pill>
                </Link>
              ))
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
