'use client';

import { useState } from 'react';
import { AutomationBuilder } from '@/components/comms/automation-builder';
import { AutomationEnrollmentsPanel } from '@/components/comms/automation-enrollments-panel';
import type { Automation, EmailTemplate } from '@/utils/api';
import type { TagSuggestion } from '@/types/crm';

type AutomationDetailViewProps = {
  automation: Automation;
  templates: EmailTemplate[];
  tagSuggestions: TagSuggestion[];
};

export function AutomationDetailView({ automation, templates, tagSuggestions }: AutomationDetailViewProps) {
  const [enrollmentRefreshToken, setEnrollmentRefreshToken] = useState(0);
  const [enrollmentTab, setEnrollmentTab] = useState<'production' | 'test'>('production');

  return (
    <div className="flex flex-col gap-6">
      <AutomationBuilder
        automation={automation}
        templates={templates}
        tagSuggestions={tagSuggestions}
        onTestComplete={() => {
          setEnrollmentTab('test');
          setEnrollmentRefreshToken((value) => value + 1);
        }}
      />
      <AutomationEnrollmentsPanel
        automationId={automation.id}
        refreshToken={enrollmentRefreshToken}
        activeTab={enrollmentTab}
        onTabChange={setEnrollmentTab}
      />
    </div>
  );
}
