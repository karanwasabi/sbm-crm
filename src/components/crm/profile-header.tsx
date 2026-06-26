'use client';

import type { ReactNode } from 'react';
import { Calendar, Globe, Mail, Phone, Star } from 'lucide-react';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StagePill } from '@/components/ui/stage-pill';
import { cn } from '@/lib/cn';
import type { ContactProfile } from '@/types/crm';

type ProfileHeaderProps = {
  contact: ContactProfile;
  onLogCall?: () => void;
  onSendEmail?: () => void;
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

function marketingContactTitle(contact: ContactProfile): string | undefined {
  const parts: string[] = ['Resend marketing audience'];
  if (contact.marketingContactSyncedAt) {
    parts.push(`Synced ${new Date(contact.marketingContactSyncedAt).toLocaleString('en-IN')}`);
  }
  if (contact.marketingUnsubscribedAt) {
    parts.push(`Unsubscribed ${new Date(contact.marketingUnsubscribedAt).toLocaleString('en-IN')}`);
  }
  return parts.length > 1 ? parts.join(' · ') : parts[0];
}

export function ProfileHeader({ contact, onLogCall, onSendEmail }: ProfileHeaderProps) {
  const showMemberStats = contact.isMember && contact.clv != null;

  return (
    <div className="relative overflow-hidden rounded-[28px] border-b-[6px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]">
      <div aria-hidden className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
      <div className="relative z-1 flex items-center gap-5.5">
        <Avatar initials={contact.initials} size="lg" tone="white" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] font-extrabold tracking-tight">{contact.name}</h2>
            <StagePill stage={contact.stage} className="tracking-wide normal-case" />
            <HeaderMetaPill title={marketingContactTitle(contact)}>
              Marketing:{' '}
              {MARKETING_CONTACT_STATUS_LABELS[contact.marketingContactStatus] ?? contact.marketingContactStatus}
            </HeaderMetaPill>
            {contact.batch && contact.batch !== '—' ? <HeaderMetaPill>{contact.batch}</HeaderMetaPill> : null}
            {contact.tags.includes('vip') ? (
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
          {contact.notes && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">{contact.notes}</p>}
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
        <div className="flex shrink-0 flex-col items-stretch gap-2">
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
        </div>
      </div>
    </div>
  );
}
