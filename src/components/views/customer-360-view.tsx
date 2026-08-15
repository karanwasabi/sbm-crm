'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  syncLeadCheckoutAction,
  markLeadCheckoutPaidOfflineAction,
  setLeadMemberKindAction,
  verifyLeadEmailAction,
  forceLeadNutritionRecalcAction,
  getLeadWhatsAppChatAction,
} from '@/app/(crm)/customers/actions';
import { SendEmailDialog } from '@/components/comms/send-email-dialog';
import { SendWhatsAppDialog } from '@/components/comms/send-whatsapp-dialog';
import { LeadPurgeModal } from '@/components/crm/lead-purge-modal';
import { OfflineEnrollDialog } from '@/components/crm/offline-enroll-dialog';
import { MembershipTransferDialog } from '@/components/crm/membership-transfer-dialog';
import { SetPasswordDialog } from '@/components/crm/set-password-dialog';
import { CorrectEmailDialog } from '@/components/crm/correct-email-dialog';
import { CorrectNameDialog } from '@/components/crm/correct-name-dialog';
import { CorrectPhoneDialog } from '@/components/crm/correct-phone-dialog';
import { AttachZohoPaymentDialog } from '@/components/crm/attach-zoho-payment-dialog';
import { CorrectHeightDialog } from '@/components/crm/correct-height-dialog';
import { CorrectWeightsDialog } from '@/components/crm/correct-weights-dialog';
import { CheckInEditorDialog } from '@/components/crm/check-in-editor-dialog';
import { EditTimezoneDialog } from '@/components/crm/edit-timezone-dialog';
import { ResetOnboardingPointADialog } from '@/components/crm/reset-onboarding-point-a-dialog';
import { MemberAppProfileCard } from '@/components/crm/member-app-profile-card';
import { PointAAssessmentCard } from '@/components/crm/point-a-assessment-card';
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
import { CohortDetailSkeleton } from '@/components/loading/cohort-detail-skeleton';
import { GenericCrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import RenewalsLoading from '@/app/(crm)/renewals/loading';
import { useToast } from '@/components/ui/toast';
import { leadDetailToContactProfile } from '@/lib/lead-display';
import { useCrmNavigate } from '@/hooks/use-crm-navigate';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { cn } from '@/lib/cn';
import type { EmailTemplate, WhatsAppFlags, WhatsAppTemplate } from '@/utils/api';
import type { LeadDetail, ProgramHistoryItem, TagSuggestion } from '@/types/crm';
import type { Country } from '@/types/reference';

const CallLogModal = dynamic(
  () => import('@/components/crm/call-log-modal').then((module) => ({ default: module.CallLogModal })),
  { ssr: false }
);

type Customer360ViewProps = {
  lead: LeadDetail;
  programHistory: ProgramHistoryItem[];
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappFlags: WhatsAppFlags;
  tagSuggestions: TagSuggestion[];
  countries: Country[];
  canSyncPayment?: boolean;
};

function getSendWhatsAppState({
  whatsappFlags,
  whatsappTemplates,
  hasPhone,
}: {
  whatsappFlags: WhatsAppFlags;
  whatsappTemplates: WhatsAppTemplate[];
  hasPhone: boolean;
}): { disabled: boolean; disabledReason?: string } {
  if (!whatsappFlags.sendsEnabled) {
    return {
      disabled: true,
      disabledReason: 'WhatsApp sends are disabled on the backend. Set WHATSAPP_SENDS_ENABLED=true.',
    };
  }

  const hasActiveTemplate = whatsappTemplates.some((template) => template.status === 'active');
  if (!hasActiveTemplate) {
    return {
      disabled: true,
      disabledReason: 'No active WhatsApp templates. Activate one in Communications → WhatsApp.',
    };
  }

  if (!hasPhone) {
    return {
      disabled: true,
      disabledReason: 'This lead has no phone number on file.',
    };
  }

  return { disabled: false };
}

const CONVONITE_NO_CHAT_MESSAGE =
  'No Convonite chat yet — send a WhatsApp template first, then wait for delivery status.';

export function Customer360View({
  lead: initialLead,
  programHistory,
  emailTemplates,
  whatsappTemplates,
  whatsappFlags,
  tagSuggestions,
  countries,
  canSyncPayment = false,
}: Customer360ViewProps) {
  const router = useRouter();
  const { push, isPending: isNavigating, pendingHref } = useCrmNavigate();
  const { toast } = useToast();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [sendWhatsAppOpen, setSendWhatsAppOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [correctEmailOpen, setCorrectEmailOpen] = useState(false);
  const [correctNameOpen, setCorrectNameOpen] = useState(false);
  const [correctPhoneOpen, setCorrectPhoneOpen] = useState(false);
  const [attachZohoPaymentOpen, setAttachZohoPaymentOpen] = useState(false);
  const [correctWeightsOpen, setCorrectWeightsOpen] = useState(false);
  const [checkInsOpen, setCheckInsOpen] = useState(false);
  const [correctHeightOpen, setCorrectHeightOpen] = useState(false);
  const [editTimezoneOpen, setEditTimezoneOpen] = useState(false);
  const [resetOnboardingPointAOpen, setResetOnboardingPointAOpen] = useState(false);
  const [memberProfileKey, setMemberProfileKey] = useState(0);
  const [convoniteUnreadCount, setConvoniteUnreadCount] = useState(0);
  const [convoniteChatReady, setConvoniteChatReady] = useState<boolean | null>(null);
  const [convoniteUnavailableReason, setConvoniteUnavailableReason] = useState(CONVONITE_NO_CHAT_MESSAGE);
  const [isRefreshing, startTransition] = useTransition();
  const [syncingPayment, startSyncPayment] = useTransition();
  const [markingPaidOffline, startMarkPaidOffline] = useTransition();
  const [recalcPending, startRecalc] = useTransition();
  const displayTimezone = useDisplayTimezone();

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  const contact = leadDetailToContactProfile(lead, displayTimezone);

  useEffect(() => {
    setContactName(contact.name);
    return () => setContactName(null);
  }, [contact.name, setContactName]);

  useEffect(() => {
    if (!whatsappFlags.sendsEnabled || !contact.phone || !lead.canMutate) {
      setConvoniteUnreadCount(0);
      setConvoniteChatReady(null);
      return;
    }

    let cancelled = false;
    setConvoniteChatReady(null);

    void getLeadWhatsAppChatAction(lead.id).then(({ chat, error }) => {
      if (cancelled) return;
      if (error || !chat?.deepLink) {
        setConvoniteChatReady(false);
        setConvoniteUnavailableReason(error ?? CONVONITE_NO_CHAT_MESSAGE);
        setConvoniteUnreadCount(0);
        return;
      }
      setConvoniteChatReady(true);
      setConvoniteUnreadCount(chat.unreadCount ?? 0);
    });

    return () => {
      cancelled = true;
    };
  }, [lead.id, lead.canMutate, contact.phone, whatsappFlags.sendsEnabled]);

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

  const handleSetMemberKind = (kind: 'renewal' | 'returnee' | null) => {
    const label = kind === 'renewal' ? 'renewal' : kind === 'returnee' ? 'returnee' : 'cleared';
    const confirmed = window.confirm(
      kind
        ? `Mark this lead as ${kind}? This shows on cohort Active Status.`
        : 'Clear renewal/returnee status for this lead?'
    );
    if (!confirmed) return;
    startTransition(async () => {
      const { error } = await setLeadMemberKindAction(lead.id, kind);
      if (error) {
        toast({ message: error, variant: 'error' });
        return;
      }
      toast({
        message: kind ? `Marked as ${label}.` : 'Renewal/returnee status cleared.',
        variant: 'success',
      });
      refresh();
    });
  };

  const handleVerifyEmail = () => {
    const confirmed = window.confirm(
      `Mark ${contact.email} as verified? This enables OTP login and does not send an email.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      const { result, error } = await verifyLeadEmailAction(lead.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to verify email.', variant: 'error' });
        return;
      }
      toast({
        message: result.alreadyVerified ? 'Email was already verified.' : 'Email verified. No email was sent.',
        variant: 'success',
      });
      refresh();
    });
  };

  const handleForceNutritionRecalc = () => {
    if (recalcPending) return;
    const confirmed = window.confirm(
      'Rebuild this member’s active-week nutrition servings from their current weight? Saved meal plans will be cleared.'
    );
    if (!confirmed) return;
    startRecalc(async () => {
      const { result, error } = await forceLeadNutritionRecalcAction(lead.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to recalculate nutrition.', variant: 'error' });
        return;
      }
      const used = result.servings?.weightKgUsed;
      toast({
        message: `Nutrition recalculated for week ${result.weekStartDate}${used != null ? ` · ${used.toFixed(1)} kg` : ''}.`,
        variant: 'success',
      });
      setMemberProfileKey((k) => k + 1);
      refresh();
    });
  };

  const handleOpenConvonite = () => {
    if (convoniteChatReady === null) {
      return;
    }
    if (convoniteChatReady !== true) {
      toast({ message: convoniteUnavailableReason, variant: 'error' });
      return;
    }

    startTransition(async () => {
      const { chat, error } = await getLeadWhatsAppChatAction(lead.id, { clearUnread: true });
      if (error || !chat?.deepLink) {
        setConvoniteChatReady(false);
        setConvoniteUnavailableReason(error ?? CONVONITE_NO_CHAT_MESSAGE);
        toast({ message: error ?? 'Could not open Convonite chat.', variant: 'error' });
        return;
      }
      setConvoniteChatReady(true);
      setConvoniteUnreadCount(0);
      window.open(chat.deepLink, '_blank', 'noopener,noreferrer');
    });
  };

  const sendWhatsAppState = getSendWhatsAppState({
    whatsappFlags,
    whatsappTemplates,
    hasPhone: Boolean(contact.phone),
  });
  const canMutate = lead.canMutate;
  const canOpenConvonite = canMutate && Boolean(contact.phone) && whatsappFlags.sendsEnabled;
  const openConvoniteForHeader = canOpenConvonite
    ? {
        onClick: handleOpenConvonite,
        disabled: convoniteChatReady !== true,
        disabledReason: convoniteUnavailableReason,
        loading: convoniteChatReady === null,
        unreadCount: convoniteUnreadCount,
      }
    : undefined;
  const sendWhatsAppForHeader = canMutate
    ? {
        onClick: () => setSendWhatsAppOpen(true),
        disabled: sendWhatsAppState.disabled,
        disabledReason: sendWhatsAppState.disabledReason,
      }
    : undefined;

  if (isNavigating) {
    if (pendingHref?.startsWith('/renewals')) {
      return <RenewalsLoading />;
    }
    if (pendingHref?.startsWith('/programs/cohorts/') || !pendingHref) {
      if (typeof window !== 'undefined' && sessionStorage.getItem('sbm-crm-c360-from') === 'renewals') {
        return <RenewalsLoading />;
      }
      return <CohortDetailSkeleton />;
    }
    return <GenericCrmPageSkeleton />;
  }

  return (
    <CrmPageLayout>
      <div className="rounded-[22px] shadow-[0_10px_24px_-8px_rgba(92,101,207,0.18)]">
        <ProfileHeader
          className="rounded-b-none shadow-none"
          contact={contact}
          memberKind={lead.memberKind}
          referredBy={lead.referredBy}
          onLogCall={canMutate ? () => setCallModalOpen(true) : undefined}
          onSendEmail={
            canMutate && emailTemplates.some((template) => template.status === 'active')
              ? () => setSendEmailOpen(true)
              : undefined
          }
          sendWhatsApp={sendWhatsAppForHeader}
          openConvonite={openConvoniteForHeader}
          onPurge={canMutate && lead.canPurge ? () => setPurgeOpen(true) : undefined}
          onEnroll={lead.canOfflineEnroll ? () => setEnrollOpen(true) : undefined}
          onTransferMembership={canSyncPayment && lead.canTransferMembership ? () => setTransferOpen(true) : undefined}
          onSyncPayment={canSyncPayment && lead.memberUserId != null ? handleSyncPayment : undefined}
          onMarkPaidOffline={canSyncPayment && lead.paymentPending != null ? handleMarkPaidOffline : undefined}
          onRecordZohoPayment={
            canSyncPayment && lead.memberUserId != null ? () => setAttachZohoPaymentOpen(true) : undefined
          }
          onMarkRenewal={
            canSyncPayment && lead.memberKind !== 'renewal' ? () => handleSetMemberKind('renewal') : undefined
          }
          onMarkReturnee={
            canSyncPayment && lead.memberKind !== 'returnee' ? () => handleSetMemberKind('returnee') : undefined
          }
          onClearMemberKind={canSyncPayment && lead.memberKind != null ? () => handleSetMemberKind(null) : undefined}
          onSetPassword={canSyncPayment && lead.memberUserId != null ? () => setSetPasswordOpen(true) : undefined}
          onCorrectName={canSyncPayment ? () => setCorrectNameOpen(true) : undefined}
          onCorrectEmail={canSyncPayment && lead.memberUserId != null ? () => setCorrectEmailOpen(true) : undefined}
          onCorrectPhone={canSyncPayment ? () => setCorrectPhoneOpen(true) : undefined}
          onVerifyEmail={canSyncPayment && lead.memberUserId != null ? handleVerifyEmail : undefined}
          onForceNutritionRecalc={canSyncPayment && lead.memberUserId != null ? handleForceNutritionRecalc : undefined}
          onCorrectWeights={canSyncPayment && lead.memberUserId != null ? () => setCorrectWeightsOpen(true) : undefined}
          onViewCheckIns={canSyncPayment && lead.memberUserId != null ? () => setCheckInsOpen(true) : undefined}
          onCorrectHeight={canSyncPayment && lead.memberUserId != null ? () => setCorrectHeightOpen(true) : undefined}
          onEditTimezone={canSyncPayment && lead.memberUserId != null ? () => setEditTimezoneOpen(true) : undefined}
          onResetOnboardingPointA={
            canSyncPayment && lead.memberUserId != null ? () => setResetOnboardingPointAOpen(true) : undefined
          }
        />
        <LeadTagsCard lead={lead} suggestions={tagSuggestions} embedded readOnly={!canMutate} />
      </div>
      {lead.paymentPending ? (
        <PaymentPendingBanner
          paymentPending={lead.paymentPending}
          onMarkPaidOffline={canSyncPayment && canMutate ? handleMarkPaidOffline : undefined}
          markingPaidOffline={markingPaidOffline}
        />
      ) : null}
      {canMutate ? <DuplicateContactCard lead={lead} duplicates={lead.contactDuplicates} onUpdated={refresh} /> : null}
      <div
        className={cn(
          'grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1fr]',
          (isRefreshing || syncingPayment || markingPaidOffline || recalcPending) && 'pointer-events-none opacity-60'
        )}
      >
        <ActivityTimeline events={lead.timeline} />
        <div className="flex w-full flex-col items-start gap-4">
          {canMutate ? (
            <LeadDataSuggestionsCard leadId={lead.id} suggestions={lead.fieldSuggestions} onUpdated={refresh} />
          ) : null}
          {canMutate ? (
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
          ) : null}
          {canSyncPayment && lead.memberUserId != null ? (
            <div className="grid w-full grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <MemberAppProfileCard
                leadId={lead.id}
                refreshKey={memberProfileKey}
                onProfileChanged={() => setMemberProfileKey((k) => k + 1)}
              />
              <PointAAssessmentCard
                leadId={lead.id}
                refreshKey={memberProfileKey}
                onChanged={() => setMemberProfileKey((k) => k + 1)}
              />
            </div>
          ) : null}
          <ProgramHistory
            items={programHistory}
            interest={lead.interest}
            batch={
              lead.stage === 'transferred' && (lead.cohortName?.trim() || lead.batch?.trim())
                ? `${lead.cohortName?.trim() || lead.batch} · Transferred`
                : lead.cohortName?.trim() || lead.batch
            }
            attribution={lead.attribution}
            leadId={lead.id}
            leadStage={lead.stage}
            canEditAccess={canSyncPayment}
            canPromoteToMember={canSyncPayment && lead.stage === 'newbie'}
            canDemoteToNewbie={canSyncPayment && lead.stage === 'member'}
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
      <SendWhatsAppDialog
        open={sendWhatsAppOpen}
        onClose={() => setSendWhatsAppOpen(false)}
        leadId={lead.id}
        templates={whatsappTemplates}
        onSent={refresh}
      />
      <LeadPurgeModal
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        leadId={lead.id}
        leadEmail={contact.email}
        leadName={contact.name}
        hasMemberAccount={lead.memberUserId != null}
        onPurged={() => push('/database')}
      />
      <OfflineEnrollDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        leadId={lead.id}
        leadName={contact.name}
        onEnrolled={refresh}
      />
      <MembershipTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        leadId={lead.id}
        leadName={contact.name}
        onTransferred={refresh}
      />
      <SetPasswordDialog
        leadId={lead.id}
        memberEmail={contact.email}
        open={setPasswordOpen}
        onOpenChange={setSetPasswordOpen}
      />
      <CorrectEmailDialog
        leadId={lead.id}
        currentEmail={contact.email}
        open={correctEmailOpen}
        onOpenChange={setCorrectEmailOpen}
        onDone={refresh}
      />
      <CorrectNameDialog
        leadId={lead.id}
        currentFirstName={lead.firstName}
        currentLastName={lead.lastName}
        open={correctNameOpen}
        onOpenChange={setCorrectNameOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
      <CorrectPhoneDialog
        leadId={lead.id}
        currentPhone={contact.phone}
        suggestedCountryIso={lead.countryCode}
        countries={countries}
        open={correctPhoneOpen}
        onOpenChange={setCorrectPhoneOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
      <AttachZohoPaymentDialog
        leadId={lead.id}
        memberEmail={contact.email}
        open={attachZohoPaymentOpen}
        onOpenChange={setAttachZohoPaymentOpen}
        onAttached={refresh}
      />
      <CorrectWeightsDialog
        leadId={lead.id}
        open={correctWeightsOpen}
        onOpenChange={setCorrectWeightsOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
      <CheckInEditorDialog leadId={lead.id} open={checkInsOpen} onOpenChange={setCheckInsOpen} />
      <CorrectHeightDialog
        leadId={lead.id}
        open={correctHeightOpen}
        onOpenChange={setCorrectHeightOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
      <EditTimezoneDialog
        leadId={lead.id}
        open={editTimezoneOpen}
        onOpenChange={setEditTimezoneOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
      <ResetOnboardingPointADialog
        leadId={lead.id}
        open={resetOnboardingPointAOpen}
        onOpenChange={setResetOnboardingPointAOpen}
        onDone={() => {
          setMemberProfileKey((k) => k + 1);
          refresh();
        }}
      />
    </CrmPageLayout>
  );
}
