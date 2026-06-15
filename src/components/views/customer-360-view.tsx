'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { CallLogModal } from '@/components/crm/call-log-modal';
import { ProfileHeader } from '@/components/crm/profile-header';
import { ProgramHistory } from '@/components/crm/program-history';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { leadDetailToContactProfile } from '@/lib/lead-display';
import type { LeadDetail } from '@/types/crm';

type Customer360ViewProps = {
  lead: LeadDetail;
};

export function Customer360View({ lead: initialLead }: Customer360ViewProps) {
  const router = useRouter();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  const contact = leadDetailToContactProfile(lead);

  useEffect(() => {
    setContactName(contact.name);
    return () => setContactName(null);
  }, [contact.name, setContactName]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <CrmPageLayout>
      <ProfileHeader contact={contact} onLogCall={() => setCallModalOpen(true)} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <ActivityTimeline events={lead.timeline} />
        <ProgramHistory items={[]} />
      </div>
      <CallLogModal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        leadId={lead.id}
        onSaved={() => {
          setCallModalOpen(false);
          refresh();
        }}
      />
    </CrmPageLayout>
  );
}
