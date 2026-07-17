'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { syncLeadCheckoutAction, markLeadCheckoutPaidOfflineAction } from '@/app/(crm)/customers/actions';
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
import { useToast } from '@/components/ui/toast';
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
  canSyncPayment?: boolean;
};

export function Customer360View({
  lead: initialLead,
  programHistory,
  emailTemplates,
  tagSuggestions,
  canSyncPayment = false,
}: Customer360ViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [syncingPayment, startSyncPayment] = useTransition();
  const [markingPaidOffline, startMarkPaidOffline] = useTransition();
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

  const handleSyncPayment = () => {
    if (syncingPayment || markingPaidOffline) return;
    startSyncPayment(async () => {
      const { result, error } = await syncLeadCheckoutAction(lead.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to sync checkout payment.', variant: 'error' });
        return;
      }
      if (result.enrolled && !result.paymentPending) {
        toast({ message: 'Payment synced. Enrollment is active.', variant: 'success' });
      } else if (result.paymentPending) {
        toast({
          message: 'No paid Razorpay order found for the pending checkout yet.',
          variant: 'error',
        });
      } else {
        toast({ message: 'Checkout sync finished.', variant: 'success' });
      }
      refresh();
    });
  };

  const handleMarkPaidOffline = () => {
    if (syncingPayment || markingPaidOffline) return;
    const confirmed = window.confirm(
      'Mark the pending checkout as paid offline? This enrolls the member without a Razorpay capture.'
    );
    if (!confirmed) return;
    startMarkPaidOffline(async () => {
      const { result, error } = await markLeadCheckoutPaidOfflineAction(lead.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to mark checkout paid offline.', variant: 'error' });
        return;
      }
      toast({
        message: result.stage
          ? `Marked paid offline. Stage is now ${result.stage}.`
          : 'Marked paid offline. Enrollment is active.',
        variant: 'success',
      });
      refresh();
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
        onPurge={() => setPurgeOpen(true)}
        onEnroll={lead.canOfflineEnroll ? () => setEnrollOpen(true) : undefined}
        onSyncPayment={canSyncPayment && lead.memberUserId != null ? handleSyncPayment : undefined}
        onMarkPaidOffline={canSyncPayment && lead.paymentPending != null ? handleMarkPaidOffline : undefined}
      />
      {lead.paymentPending ? (
        <PaymentPendingBanner
          paymentPending={lead.paymentPending}
          onMarkPaidOffline={canSyncPayment ? handleMarkPaidOffline : undefined}
          markingPaidOffline={markingPaidOffline}
        />
      ) : null}
      <DuplicateContactCard lead={lead} duplicates={lead.contactDuplicates} onUpdated={refresh} />
      <LeadTagsCard lead={lead} suggestions={tagSuggestions} />
      <div
        className={cn(
          'grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1fr]',
          (isRefreshing || syncingPayment || markingPaidOffline) && 'pointer-events-none opacity-60'
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
            leadId={lead.id}
            canEditAccess={canSyncPayment}
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
