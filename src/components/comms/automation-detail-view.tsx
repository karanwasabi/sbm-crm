'use client';

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
  return (
    <div className="flex flex-col gap-6">
      <AutomationBuilder automation={automation} templates={templates} tagSuggestions={tagSuggestions} />
      <AutomationEnrollmentsPanel automationId={automation.id} />
    </div>
  );
}
