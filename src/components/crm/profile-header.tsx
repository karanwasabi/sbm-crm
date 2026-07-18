'use client';

import type { ReactNode } from 'react';
import { Calendar, Globe, Mail, Phone, Star } from 'lucide-react';
import { formatActivityTimestamp } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { ProfileOverflowMenu } from '@/components/crm/profile-overflow-menu';
import { MemberKindPill } from '@/components/ui/member-kind-pill';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StagePill } from '@/components/ui/stage-pill';
import { cn } from '@/lib/cn';
import { leadHasTag } from '@/lib/lead-tags';
import type { ContactProfile } from '@/types/crm';

type ProfileHeaderProps = {
  contact: ContactProfile;
  onLogCall?: () => void;
  onSendEmail?: () => void;
  onPurge?: () => void;
  onEnroll?: () => void;
  onSyncPayment?: () => void;
  onMarkPaidOffline?: () => void;
  onMarkRenewal?: () => void;
  onMarkReturnee?: () => void;
  onClearMemberKind?: () => void;
  onSetPassword?: () => void;
  memberKind?: 'renewal' | 'returnee' | null;
};

const HEADER_PILL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.25 text-[10px] font-bold tracking-wide normal-case';

function HeaderMetaPill({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn('border-b-2 border-black/22 bg-black/18 text-white', HEADER_PILL_CLASS, className)}
    >
      {children}
    </span>
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
  onPurge,
  onEnroll,
  onSyncPayment,
  onMarkPaidOffline,
  onMarkRenewal,
  onMarkReturnee,
  onClearMemberKind,
  onSetPassword,
  memberKind = null,
}: ProfileHeaderProps) {
  const displayTimezone = useDisplayTimezone();
  const showMemberStats = contact.isMember && contact.clv != null;

  return (
    <div className="relative rounded-[28px] border-b-[6px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
      </div>
      <div className="relative z-1 flex items-center gap-5.5">
        <Avatar initials={contact.initials} size="lg" tone="white" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] font-extrabold tracking-tight">{contact.name}</h2>
            <StagePill stage={contact.stage} className="tracking-wide normal-case" />
            {memberKind === 'renewal' || memberKind === 'returnee' ? <MemberKindPill kind={memberKind} /> : null}
            <HeaderMetaPill title={marketingContactTitle(contact, displayTimezone)}>
              Marketing:{' '}
              {MARKETING_CONTACT_STATUS_LABELS[contact.marketingContactStatus] ?? contact.marketingContactStatus}
            </HeaderMetaPill>
            {contact.batch && contact.batch !== '—' ? <HeaderMetaPill>{contact.batch}</HeaderMetaPill> : null}
            {leadHasTag(contact.tags, 'vip') ? (
              <span className={cn('border-b-2 border-[#C28C00] bg-motivation text-slate-900', HEADER_PILL_CLASS)}>
                <Star className="h-2.75 w-2.75 fill-slate-900" />
                VIP
              </span>
            ) : null}
            {!contact.isMember ? <HeaderMetaPill>Not a member yet</HeaderMetaPill> : null}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-5.5 text-xs opacity-92">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              {contact.email}
            </span>
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 font-semibold text-white no-underline"
              >
                <Phone className="h-3 w-3" />
                {contact.phone}
              </a>
            )}
            {contact.location && contact.location !== '—' && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {contact.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Added {contact.joinedAt}
            </span>
            {contact.manualSourceLabel && (
              <span className="inline-flex items-center gap-1.5">Source · {contact.manualSourceLabel}</span>
            )}
          </div>
          {showMemberStats && (
            <div className="mt-3.5 inline-flex items-center gap-4.5 rounded-2xl border-b-2 border-black/22 bg-black/16 px-4.5 py-3">
              <div>
                <div className="text-[22px] font-extrabold">{contact.clv}</div>
                <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Lifetime value</div>
              </div>
              <div className="h-7.5 w-px bg-white/25" />
              <div>
                <div className="text-[22px] font-extrabold">{contact.programs}</div>
                <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Programs</div>
              </div>
              <div className="h-7.5 w-px bg-white/25" />
              <div>
                <div className="text-[22px] font-extrabold">{contact.loggingPct}%</div>
                <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Logging</div>
              </div>
            </div>
          )}
        </div>
        <div className="relative z-10 flex shrink-0 flex-nowrap items-center justify-end gap-2">
          {contact.phone && (
            <Button
              variant="light"
              size="sm"
              leftIcon={<Phone className="h-3.5 w-3.5" />}
              onClick={() => {
                window.location.href = `tel:${contact.phone}`;
              }}
            >
              Call
            </Button>
          )}
          {contact.stage !== 'lost' && (
            <Button variant="light" size="sm" onClick={onLogCall}>
              Log call
            </Button>
          )}
          {onSendEmail ? (
            <Button variant="light" size="sm" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={onSendEmail}>
              Send email
            </Button>
          ) : null}
          {onPurge ||
          onEnroll ||
          onSyncPayment ||
          onMarkPaidOffline ||
          onMarkRenewal ||
          onMarkReturnee ||
          onClearMemberKind ||
          onSetPassword ? (
            <ProfileOverflowMenu
              onPurge={onPurge}
              onEnroll={onEnroll}
              onSyncPayment={onSyncPayment}
              onMarkPaidOffline={onMarkPaidOffline}
              onMarkRenewal={onMarkRenewal}
              onMarkReturnee={onMarkReturnee}
              onClearMemberKind={onClearMemberKind}
              onSetPassword={onSetPassword}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
