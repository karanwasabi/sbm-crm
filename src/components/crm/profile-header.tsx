'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Mail, Phone, Star } from 'lucide-react';
import { formatActivityTimestamp } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { ConvoniteIcon } from '@/components/icons/convonite-icon';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { ProfileOverflowMenu } from '@/components/crm/profile-overflow-menu';
import { MemberKindPill } from '@/components/ui/member-kind-pill';
import { Avatar } from '@/components/ui/avatar';
import { StagePill } from '@/components/ui/stage-pill';
import { TCButton } from '@/components/ui/tc-button';
import { useToast } from '@/components/ui/toast';
import { cohortCardHref } from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import { leadHasTag } from '@/lib/lead-tags';
import type { ContactProfile } from '@/types/crm';

type ProfileSendWhatsAppAction = {
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

type ProfileOpenConvoniteAction = {
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  unreadCount?: number;
};

type ProfileHeaderProps = {
  contact: ContactProfile;
  onLogCall?: () => void;
  onSendEmail?: () => void;
  sendWhatsApp?: ProfileSendWhatsAppAction;
  openConvonite?: ProfileOpenConvoniteAction;
  onPurge?: () => void;
  onEnroll?: () => void;
  onTransferMembership?: () => void;
  onSyncPayment?: () => void;
  onMarkPaidOffline?: () => void;
  onRecordZohoPayment?: () => void;
  onMarkRenewal?: () => void;
  onMarkReturnee?: () => void;
  onClearMemberKind?: () => void;
  onSetPassword?: () => void;
  onCorrectEmail?: () => void;
  onVerifyEmail?: () => void;
  onForceNutritionRecalc?: () => void;
  onCorrectWeights?: () => void;
  onViewCheckIns?: () => void;
  onCorrectHeight?: () => void;
  onEditTimezone?: () => void;
  onResetOnboardingPointA?: () => void;
  memberKind?: 'renewal' | 'returnee' | null;
  referredBy?: import('@/types/crm').LeadReferredBy | null;
  className?: string;
};

const HEADER_PILL_CLASS =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide normal-case';

function HeaderMetaPill({
  children,
  className,
  title,
  href,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  href?: string;
}) {
  const classes = cn('border-b-2 border-black/22 bg-black/18 text-white', HEADER_PILL_CLASS, className);

  if (href) {
    return (
      <Link href={href} title={title} className={cn(classes, 'no-underline transition-colors hover:bg-black/28')}>
        {children}
      </Link>
    );
  }

  return (
    <span title={title} className={classes}>
      {children}
    </span>
  );
}

function ProfileDetailField({
  label,
  children,
  copyValue,
  className,
}: {
  label: string;
  children: ReactNode;
  copyValue?: string;
  className?: string;
}) {
  const { toast } = useToast();

  const copy = async () => {
    if (!copyValue?.trim()) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast({ message: `Copied ${label.toLowerCase()}`, variant: 'success' });
    } catch {
      toast({ message: `Could not copy ${label.toLowerCase()}`, variant: 'error' });
    }
  };

  const valueClass = 'mt-0.5 truncate text-[12.5px] leading-snug font-semibold text-white';

  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[10px] font-bold tracking-[0.08em] text-white/55 uppercase">{label}</div>
      {copyValue ? (
        <button
          type="button"
          onClick={copy}
          className={cn(valueClass, 'block w-full cursor-pointer text-left hover:underline')}
        >
          {children}
        </button>
      ) : (
        <div className={valueClass}>{children}</div>
      )}
    </div>
  );
}

function marketingContactTitle(contact: ContactProfile, timezone: string): string | undefined {
  const parts: string[] = ['Resend marketing audience'];
  if (contact.marketingContactSyncedAt) {
    parts.push(`Synced ${formatActivityTimestamp(contact.marketingContactSyncedAt, timezone)}`);
  }
  if (contact.marketingUnsubscribedAt) {
    parts.push(`Unsubscribed ${formatActivityTimestamp(contact.marketingUnsubscribedAt, timezone)}`);
  }
  return parts.length > 1 ? parts.join(' · ') : parts[0];
}

export function ProfileHeader({
  contact,
  onLogCall,
  onSendEmail,
  sendWhatsApp,
  openConvonite,
  onPurge,
  onEnroll,
  onTransferMembership,
  onSyncPayment,
  onMarkPaidOffline,
  onRecordZohoPayment,
  onMarkRenewal,
  onMarkReturnee,
  onClearMemberKind,
  onSetPassword,
  onCorrectEmail,
  onVerifyEmail,
  onForceNutritionRecalc,
  onCorrectWeights,
  onViewCheckIns,
  onCorrectHeight,
  onEditTimezone,
  onResetOnboardingPointA,
  memberKind = null,
  referredBy = null,
  className,
}: ProfileHeaderProps) {
  const displayTimezone = useDisplayTimezone();
  const showCommunicate = (contact.stage !== 'lost' && onLogCall) || onSendEmail || sendWhatsApp || openConvonite;
  const hasOverflowMenu = Boolean(
    onPurge ||
    onEnroll ||
    onTransferMembership ||
    onSyncPayment ||
    onMarkPaidOffline ||
    onRecordZohoPayment ||
    onMarkRenewal ||
    onMarkReturnee ||
    onClearMemberKind ||
    onSetPassword ||
    onCorrectEmail ||
    onVerifyEmail ||
    onForceNutritionRecalc ||
    onCorrectWeights ||
    onViewCheckIns ||
    onCorrectHeight ||
    onEditTimezone ||
    onResetOnboardingPointA
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px] border-b-[5px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% text-white shadow-[0_8px_20px_-8px_rgba(92,101,207,0.25)]',
        className
      )}
    >
      <div className="relative z-1">
        <div className="px-4 py-3.5 sm:px-5">
          <div className="grid grid-cols-[3rem_1fr] items-center gap-x-3">
            <Avatar
              initials={contact.initials}
              size="md"
              tone="white"
              className="col-start-1 h-12 w-12 border-2 border-white/35 text-sm"
            />

            <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
                <h2 className="shrink-0 text-xl leading-tight font-extrabold tracking-tight">{contact.name}</h2>
                <StagePill stage={contact.stage} className="tracking-wide normal-case" />
                {memberKind === 'renewal' || memberKind === 'returnee' ? <MemberKindPill kind={memberKind} /> : null}
                <HeaderMetaPill title={marketingContactTitle(contact, displayTimezone)}>
                  Marketing:{' '}
                  {MARKETING_CONTACT_STATUS_LABELS[contact.marketingContactStatus] ?? contact.marketingContactStatus}
                </HeaderMetaPill>
                {contact.batch && contact.batch !== '—' ? (
                  <HeaderMetaPill
                    href={contact.cohortId ? cohortCardHref(contact.cohortId) : undefined}
                    title={contact.cohortId ? 'Open cohort program management' : undefined}
                  >
                    Cohort: {contact.stage === 'transferred' ? `${contact.batch} · Transferred` : contact.batch}
                  </HeaderMetaPill>
                ) : null}
                {referredBy ? (
                  <HeaderMetaPill
                    href={referredBy.referrerLeadId ? `/customers/${referredBy.referrerLeadId}` : undefined}
                    title={
                      referredBy.referrerLeadId
                        ? `Open ${referredBy.referrerName} (${referredBy.referrerEmail})`
                        : referredBy.referrerEmail
                    }
                  >
                    Referred by {referredBy.referrerName}
                  </HeaderMetaPill>
                ) : null}
                {leadHasTag(contact.tags, 'vip') ? (
                  <span className={cn('border-b-2 border-[#C28C00] bg-motivation text-slate-900', HEADER_PILL_CLASS)}>
                    <Star className="h-2.5 w-2.5 fill-slate-900" />
                    VIP
                  </span>
                ) : null}
                {!contact.isMember ? <HeaderMetaPill>Not a member yet</HeaderMetaPill> : null}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {showCommunicate ? (
                  <>
                    {contact.stage !== 'lost' && onLogCall ? (
                      <TCButton gradient="call" leftIcon={<Phone className="h-3.5 w-3.5" />} onClick={onLogCall}>
                        Log Call
                      </TCButton>
                    ) : null}
                    {onSendEmail ? (
                      <TCButton gradient="email" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={onSendEmail}>
                        Send Email
                      </TCButton>
                    ) : null}
                    {sendWhatsApp ? (
                      <span
                        title={sendWhatsApp.disabled ? sendWhatsApp.disabledReason : undefined}
                        className="inline-flex"
                      >
                        <TCButton
                          gradient="whatsapp"
                          leftIcon={<WhatsAppIcon />}
                          onClick={sendWhatsApp.onClick}
                          disabled={sendWhatsApp.disabled}
                        >
                          Send WhatsApp
                        </TCButton>
                      </span>
                    ) : null}
                    {openConvonite ? (
                      <span
                        title={openConvonite.disabled ? openConvonite.disabledReason : 'Open in Convonite'}
                        className="relative inline-flex"
                        onClick={() => openConvonite.onClick()}
                      >
                        <TCButton
                          gradient="convonite"
                          leftIcon={<ConvoniteIcon />}
                          loading={openConvonite.loading}
                          loadingLabel="Checking…"
                          disabled={openConvonite.disabled || openConvonite.loading}
                          className={
                            openConvonite.disabled || openConvonite.loading ? 'pointer-events-none' : undefined
                          }
                        >
                          Convonite
                        </TCButton>
                        {!openConvonite.loading && (openConvonite.unreadCount ?? 0) > 0 ? (
                          <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-extrabold text-white tabular-nums ring-2 ring-[#6A71E6]">
                            {(openConvonite.unreadCount ?? 0) > 99 ? '99+' : openConvonite.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </>
                ) : null}
                {hasOverflowMenu ? (
                  <ProfileOverflowMenu
                    onPurge={onPurge}
                    onEnroll={onEnroll}
                    onTransferMembership={onTransferMembership}
                    onSyncPayment={onSyncPayment}
                    onMarkPaidOffline={onMarkPaidOffline}
                    onRecordZohoPayment={onRecordZohoPayment}
                    onMarkRenewal={onMarkRenewal}
                    onMarkReturnee={onMarkReturnee}
                    onClearMemberKind={onClearMemberKind}
                    onSetPassword={onSetPassword}
                    onCorrectEmail={onCorrectEmail}
                    onVerifyEmail={onVerifyEmail}
                    onForceNutritionRecalc={onForceNutritionRecalc}
                    onCorrectWeights={onCorrectWeights}
                    onViewCheckIns={onViewCheckIns}
                    onCorrectHeight={onCorrectHeight}
                    onEditTimezone={onEditTimezone}
                    onResetOnboardingPointA={onResetOnboardingPointA}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/12 bg-black/10 px-4 py-2.5 sm:px-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 xl:grid-cols-6 xl:gap-x-0">
            <ProfileDetailField label="Email" copyValue={contact.email} className="xl:px-3 xl:first:pl-0">
              {contact.email}
            </ProfileDetailField>
            <ProfileDetailField
              label="Phone"
              copyValue={contact.phone || undefined}
              className="xl:border-l xl:border-white/10 xl:px-3"
            >
              {contact.phone || '—'}
            </ProfileDetailField>
            <ProfileDetailField label="Location" className="xl:border-l xl:border-white/10 xl:px-3">
              {contact.location && contact.location !== '—' ? contact.location : '—'}
            </ProfileDetailField>
            <ProfileDetailField label="Added" className="xl:border-l xl:border-white/10 xl:px-3">
              {contact.joinedAt}
            </ProfileDetailField>
            <ProfileDetailField label="Source" className="xl:border-l xl:border-white/10 xl:px-3">
              {contact.manualSourceLabel || '—'}
            </ProfileDetailField>
            <ProfileDetailField label="Coach" className="xl:border-l xl:border-white/10 xl:px-3 xl:last:pr-0">
              {contact.coachName ?? '—'}
            </ProfileDetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
