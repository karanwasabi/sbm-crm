'use client';

import { Mail, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { MarketingCapMeter } from '@/components/comms/marketing-cap-meter';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { Pill } from '@/components/ui/pill';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import type { EmailTemplate, MarketingContactsSummary } from '@/utils/api';

type CommunicationsViewProps = {
  templates: EmailTemplate[];
  marketingSummary: MarketingContactsSummary;
};

export function CommunicationsView({ templates, marketingSummary }: CommunicationsViewProps) {
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
          <SectionHead title="Automations" subtitle="Phase 2 — visual workflow builder" />
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Workflow className="h-5 w-5" />
            </div>
            <p className="max-w-md text-sm font-medium text-slate-600">
              Delay-based nurture workflows are coming next. Templates and manual sends are live now.
            </p>
          </div>
        </Card>
      ) : null}

      {tab === 'performance' ? (
        <Card>
          <SectionHead title="Performance" subtitle="Phase 1.5 — delivery and click tracking via Resend webhooks" />
          <p className="text-sm text-slate-500">
            Send logging is active. Open/click analytics will appear here once Resend webhooks are connected.
          </p>
        </Card>
      ) : null}
    </CrmPageLayout>
  );
}
