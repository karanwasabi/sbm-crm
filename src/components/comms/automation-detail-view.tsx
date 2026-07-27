'use client';

import { AutomationBuilder } from '@/components/comms/automation-builder';
import { AutomationEnrollmentsPanel } from '@/components/comms/automation-enrollments-panel';
import type { Automation, EmailTemplate, WhatsAppTemplate } from '@/utils/api';
import type { AutomationChannel } from '@/lib/automation-types';
import type { TagSuggestion } from '@/types/crm';

type AutomationDetailViewProps = {
  automation: Automation;
  channel?: AutomationChannel;
  emailTemplates: EmailTemplate[];
  whatsappTemplates?: WhatsAppTemplate[];
  tagSuggestions: TagSuggestion[];
};

export function AutomationDetailView({
  automation,
  channel = 'email',
  emailTemplates,
  whatsappTemplates = [],
  tagSuggestions,
}: AutomationDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AutomationBuilder
        automation={automation}
        channel={channel}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        tagSuggestions={tagSuggestions}
      />
      <AutomationEnrollmentsPanel automationId={automation.id} graphJson={automation.graphJson} />
    </div>
  );
}
