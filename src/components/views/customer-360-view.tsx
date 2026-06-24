'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MarketingContactCard } from '@/components/comms/marketing-contact-card';
import { SendEmailDialog } from '@/components/comms/send-email-dialog';
import { LeadAttributionCard } from '@/components/leads/lead-attribution-card';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { PaymentPendingBanner } from '@/components/crm/payment-pending-banner';
import { ProfileHeader } from '@/components/crm/profile-header';
import { ProgramHistory } from '@/components/crm/program-history';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { leadDetailToContactProfile } from '@/lib/lead-display';
import { cn } from '@/lib/cn';
import type { EmailTemplate } from '@/utils/api';
import type { LeadDetail, ProgramHistoryItem } from '@/types/crm';

const CallLogModal = dynamic(
  () => import('@/components/crm/call-log-modal').then((module) => ({ default: module.CallLogModal })),
  { ssr: false }
);

type Customer360ViewProps = {
  lead: LeadDetail;
  programHistory: ProgramHistoryItem[];
  emailTemplates: EmailTemplate[];
};

export function Customer360View({ lead: initialLead, programHistory, emailTemplates }: Customer360ViewProps) {
  const router = useRouter();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

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
      <ProfileHeader
        contact={contact}
        onLogCall={() => setCallModalOpen(true)}
        onSendEmail={
          emailTemplates.some((template) => template.status === 'active') ? () => setSendEmailOpen(true) : undefined
        }
      />
      {lead.paymentPending ? <PaymentPendingBanner paymentPending={lead.paymentPending} /> : null}
      <MarketingContactCard lead={lead} />
      {lead.attribution ? <LeadAttributionCard attribution={lead.attribution} /> : null}
      <div
        className={cn(
          'grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]',
          isRefreshing && 'pointer-events-none opacity-60'
        )}
      >
        <ActivityTimeline events={lead.timeline} />
        <ProgramHistory items={programHistory} />
      </div>
      {callModalOpen ? (
        <CallLogModal
          open={callModalOpen}
          onClose={() => setCallModalOpen(false)}
          leadId={lead.id}
          onSaved={() => {
            setCallModalOpen(false);
            refresh();
          }}
        />
      ) : null}
      <SendEmailDialog
        open={sendEmailOpen}
        onClose={() => setSendEmailOpen(false)}
        leadId={lead.id}
        templates={emailTemplates}
        onSent={refresh}
      />
    </CrmPageLayout>
  );
}
