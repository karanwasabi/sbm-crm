'use client';

import { useState } from 'react';
import { AutomationBuilder } from '@/components/comms/automation-builder';
import { AutomationEnrollmentsPanel } from '@/components/comms/automation-enrollments-panel';
import type { Automation } from '@/utils/api';
import type { EmailTemplate } from '@/utils/api';

type AutomationDetailViewProps = {
  automation: Automation;
  templates: EmailTemplate[];
};

export function AutomationDetailView({ automation, templates }: AutomationDetailViewProps) {
  const [enrollmentRefreshToken, setEnrollmentRefreshToken] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <AutomationBuilder
        automation={automation}
        templates={templates}
        onTestComplete={() => setEnrollmentRefreshToken((value) => value + 1)}
      />
      <AutomationEnrollmentsPanel automationId={automation.id} refreshToken={enrollmentRefreshToken} />
    </div>
  );
}
