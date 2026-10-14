'use client';

import { AutomationBuilder } from '@/components/comms/automation-builder';
import { AutomationEnrollmentsPanel } from '@/components/comms/automation-enrollments-panel';
import type { Automation, EmailTemplate, StaffMember, WhatsAppTemplate } from '@/utils/api';
import type { TagSuggestion } from '@/types/crm';
import type { EventOption } from '@/types/events';

type AutomationDetailViewProps = {
  automation: Automation;
  emailTemplates: EmailTemplate[];
  whatsappTemplates?: WhatsAppTemplate[];
  tagSuggestions: TagSuggestion[];
  coaches?: StaffMember[];
  events?: EventOption[];
};

export function AutomationDetailView({
  automation,
  emailTemplates,
  whatsappTemplates = [],
  tagSuggestions,
  coaches = [],
  events = [],
}: AutomationDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AutomationBuilder
        automation={automation}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        tagSuggestions={tagSuggestions}
        coaches={coaches}
        events={events}
      />
      <AutomationEnrollmentsPanel automationId={automation.id} graphJson={automation.graphJson} />
    </div>
  );
}
