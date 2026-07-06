'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SendEmailDialog } from '@/components/comms/send-email-dialog';
import { LeadPurgeModal } from '@/components/crm/lead-purge-modal';
import { OfflineEnrollDialog } from '@/components/crm/offline-enroll-dialog';
import { LeadDataSuggestionsCard } from '@/components/leads/lead-data-suggestions-card';
import { DuplicateContactCard } from '@/components/leads/duplicate-contact-card';
import { LeadTagsCard } from '@/components/leads/lead-tags-card';
import { ManualIntakeRecordsCard } from '@/components/crm/manual-intake-records-card';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { PaymentPendingBanner } from '@/components/crm/payment-pending-banner';
import { ProfileHeader } from '@/components/crm/profile-header';
import { ProgramHistory } from '@/components/crm/program-history';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { leadDetailToContactProfile } from '@/lib/lead-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { cn } from '@/lib/cn';
import type { EmailTemplate } from '@/utils/api';
import type { LeadDetail, ProgramHistoryItem, TagSuggestion } from '@/types/crm';

const CallLogModal = dynamic(
  () => import('@/components/crm/call-log-modal').then((module) => ({ default: module.CallLogModal })),
  { ssr: false }
);

type Customer360ViewProps = {
  lead: LeadDetail;
  programHistory: ProgramHistoryItem[];
  emailTemplates: EmailTemplate[];
  tagSuggestions: TagSuggestion[];
};

export function Customer360View({
  lead: initialLead,
  programHistory,
  emailTemplates,
  tagSuggestions,
}: Customer360ViewProps) {
  const router = useRouter();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const displayTimezone = useDisplayTimezone();

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  const contact = leadDetailToContactProfile(lead, displayTimezone);

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
        onPurge={lead.canPurge ? () => setPurgeOpen(true) : undefined}
        onEnroll={lead.canOfflineEnroll ? () => setEnrollOpen(true) : undefined}
      />
      {lead.paymentPending ? <PaymentPendingBanner paymentPending={lead.paymentPending} /> : null}
      <DuplicateContactCard lead={lead} duplicates={lead.contactDuplicates} onUpdated={refresh} />
      <LeadTagsCard lead={lead} suggestions={tagSuggestions} />
      <div
        className={cn(
          'grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1fr]',
          isRefreshing && 'pointer-events-none opacity-60'
        )}
      >
        <ActivityTimeline events={lead.timeline} />
        <div className="flex w-full flex-col items-start gap-4">
          <LeadDataSuggestionsCard leadId={lead.id} suggestions={lead.fieldSuggestions} onUpdated={refresh} />
          <ManualIntakeRecordsCard
            leadId={lead.id}
            profile={{
              name: lead.name,
              phone: lead.phone,
              city: lead.city,
              countryCode: lead.countryCode,
              stage: lead.stage,
            }}
            records={lead.manualIntakeRecords}
            suggestions={lead.fieldSuggestions}
            onUpdated={refresh}
          />
          <ProgramHistory
            items={programHistory}
            interest={lead.interest}
            batch={lead.batch}
            attribution={lead.attribution}
          />
        </div>
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
      <LeadPurgeModal
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        leadId={lead.id}
        leadEmail={contact.email}
        leadName={contact.name}
        hasMemberAccount={lead.memberUserId != null}
        onPurged={() => router.push('/database')}
      />
      <OfflineEnrollDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        leadId={lead.id}
        leadName={contact.name}
        onEnrolled={refresh}
      />
    </CrmPageLayout>
  );
}
