'use client';

import { useEffect, useState } from 'react';
import { TabBar } from '@/components/crm/tab-bar';
import { IntakeFormsTab } from '@/components/leads/intake-forms-tab';
import { ManualLeadTab } from '@/components/leads/manual-lead-tab';
import { MetaIntakeTab } from '@/components/leads/meta-intake-tab';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import type { InboundLead, IntakeForm, MetaIntegrationStatus, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';

const LEAD_INTAKE_TABS = ['Manual Lead', 'Intake Forms', 'Integrations'] as const;
type LeadIntakeTab = (typeof LEAD_INTAKE_TABS)[number];

function resolveLeadIntakeTab(tab?: string): LeadIntakeTab {
  if (tab === 'intake-forms') return 'Intake Forms';
  if (tab === 'integrations' || tab === 'meta') return 'Integrations';
  return 'Manual Lead';
}

function tabQueryValue(tab: LeadIntakeTab): string {
  if (tab === 'Intake Forms') return 'intake-forms';
  if (tab === 'Integrations') return 'integrations';
  return 'manual';
}

function syncLeadIntakeUrl(tab: LeadIntakeTab) {
  const params = new URLSearchParams();
  const queryTab = tabQueryValue(tab);
  if (queryTab !== 'manual') {
    params.set('tab', queryTab);
  }
  const query = params.toString();
  const nextUrl = query ? `/leads?${query}` : '/leads';
  window.history.replaceState(null, '', nextUrl);
}

type LeadIntakeViewProps = {
  countries: Country[];
  integrationStatus: MetaIntegrationStatus;
  inboundLeads: InboundLead[];
  tagSuggestions: TagSuggestion[];
  intakeForms: IntakeForm[];
  initialTab?: string;
  initialFormId?: string;
};

export function LeadIntakeView({
  countries,
  integrationStatus,
  inboundLeads,
  tagSuggestions,
  intakeForms,
  initialTab,
  initialFormId,
}: LeadIntakeViewProps) {
  const [activeTab, setActiveTab] = useState<LeadIntakeTab>(() => resolveLeadIntakeTab(initialTab));

  useEffect(() => {
    setActiveTab(resolveLeadIntakeTab(initialTab));
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    const next = tab as LeadIntakeTab;
    setActiveTab(next);
    syncLeadIntakeUrl(next);
  };

  return (
    <CrmPageLayout>
      <TabBar tabs={[...LEAD_INTAKE_TABS]} active={activeTab} onChange={handleTabChange} />
      <div className="mt-4">
        {activeTab === 'Manual Lead' ? <ManualLeadTab countries={countries} tagSuggestions={tagSuggestions} /> : null}
        {activeTab === 'Intake Forms' ? (
          <IntakeFormsTab forms={intakeForms} tagSuggestions={tagSuggestions} initialFormId={initialFormId} />
        ) : null}
        {activeTab === 'Integrations' ? (
          <MetaIntakeTab integrationStatus={integrationStatus} inboundLeads={inboundLeads} />
        ) : null}
      </div>
    </CrmPageLayout>
  );
}
