'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { TabBar } from '@/components/crm/tab-bar';
import { IntakeFormsTab } from '@/components/leads/intake-forms-tab';
import { ManualLeadTab } from '@/components/leads/manual-lead-tab';
import { MetaIntakeTab } from '@/components/leads/meta-intake-tab';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import type { InboundLead, IntakeForm, MetaIntegrationStatus, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';

const LEAD_INTAKE_TABS = ['Manual Lead', 'Intake Forms', 'Meta'] as const;
type LeadIntakeTab = (typeof LEAD_INTAKE_TABS)[number];

function resolveLeadIntakeTab(tab?: string): LeadIntakeTab {
  if (tab === 'intake-forms') return 'Intake Forms';
  if (tab === 'meta') return 'Meta';
  return 'Manual Lead';
}

function tabQueryValue(tab: LeadIntakeTab): string {
  if (tab === 'Intake Forms') return 'intake-forms';
  if (tab === 'Meta') return 'meta';
  return 'manual';
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
  const router = useRouter();
  const activeTab = useMemo(() => resolveLeadIntakeTab(initialTab), [initialTab]);

  const handleTabChange = (tab: string) => {
    const next = tab as LeadIntakeTab;
    const params = new URLSearchParams();
    params.set('tab', tabQueryValue(next));
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <CrmPageLayout>
      <TabBar tabs={[...LEAD_INTAKE_TABS]} active={activeTab} onChange={handleTabChange} />
      <div className="mt-4">
        {activeTab === 'Manual Lead' ? <ManualLeadTab countries={countries} tagSuggestions={tagSuggestions} /> : null}
        {activeTab === 'Intake Forms' ? (
          <IntakeFormsTab forms={intakeForms} tagSuggestions={tagSuggestions} initialFormId={initialFormId} />
        ) : null}
        {activeTab === 'Meta' ? (
          <MetaIntakeTab integrationStatus={integrationStatus} inboundLeads={inboundLeads} />
        ) : null}
      </div>
    </CrmPageLayout>
  );
}
