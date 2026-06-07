'use client';

import { useState } from 'react';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { CallLogModal } from '@/components/crm/call-log-modal';
import { ProfileHeader } from '@/components/crm/profile-header';
import { ProgramHistory } from '@/components/crm/program-history';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getCustomerById, MOCK_PROGRAM_HISTORY, MOCK_TIMELINE } from '@/lib/mock/customers';

type Customer360ViewProps = {
  customerId: string;
};

export function Customer360View({ customerId }: Customer360ViewProps) {
  const [callModalOpen, setCallModalOpen] = useState(false);
  const customer = getCustomerById(customerId);

  if (!customer) {
    return (
      <CrmPageLayout>
        <p className="text-sm text-slate-500">Customer not found.</p>
      </CrmPageLayout>
    );
  }

  return (
    <CrmPageLayout>
      <ProfileHeader customer={customer} onLogCall={() => setCallModalOpen(true)} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <ActivityTimeline events={MOCK_TIMELINE} />
        <ProgramHistory items={MOCK_PROGRAM_HISTORY} />
      </div>
      <CallLogModal open={callModalOpen} onClose={() => setCallModalOpen(false)} />
    </CrmPageLayout>
  );
}
