'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownRight, ArrowUpRight, CalendarRange } from 'lucide-react';
import { EditMembershipAccessDialog } from '@/components/crm/edit-membership-access-dialog';
import { demoteLeadToNewbieAction, promoteLeadToMemberAction } from '@/app/(crm)/customers/actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { useToast } from '@/components/ui/toast';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { attributionFormLabel, attributionSourceLabel } from '@/lib/lead-attribution';
import { resolveDisplayTimezone } from '@/lib/datetime-display';
import type { LeadAttribution, ProgramHistoryItem } from '@/types/crm';

type ProgramHistoryProps = {
  items: ProgramHistoryItem[];
  interest?: string;
  batch?: string;
  attribution?: LeadAttribution | null;
  leadId?: string;
  canEditAccess?: boolean;
  canPromoteToMember?: boolean;
  canDemoteToNewbie?: boolean;
};

function label(value: string | null | undefined) {
  return value && value.trim() ? value : '—';
}

function formatMembershipDate(value: string | null | undefined, timezoneId?: string | null): string {
  if (!value?.trim()) return '—';
  // Date-only YYYY-MM-DD (cohort starts_on)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: resolveDisplayTimezone(timezoneId),
  }).format(date);
}

function enrollmentStatusTone(status: string): 'success' | 'warn' | 'danger' | 'neutral' | 'brand' {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'upcoming') return 'brand';
  if (normalized === 'payment pending') return 'warn';
  if (normalized === 'cancelled') return 'danger';
  if (normalized === 'completed') return 'neutral';
  return 'neutral';
}

type AutoRenewInfo = {
  label: string;
  tone: 'success' | 'warn' | 'danger' | 'neutral';
};

function autoRenewInfo(item: ProgramHistoryItem): AutoRenewInfo | null {
  const status = item.status.trim().toLowerCase();
  if (status === 'payment pending' || status === 'cancelled') return null;
  if (item.cancelAtPeriodEnd == null && !item.subscriptionStatus && !item.accessUntil) return null;

  if (item.cancelAtPeriodEnd === true) {
    return { label: 'Cancelling', tone: 'warn' };
  }
  const sub = (item.subscriptionStatus ?? '').trim().toLowerCase();
  if (sub === 'cancelled' || sub === 'halted') {
    return { label: 'Off', tone: 'danger' };
  }
  if (item.accessUntil || item.cancelAtPeriodEnd === false || sub) {
    return { label: 'On', tone: 'success' };
  }
  return null;
}

function isGraceOpen(graceUntil: string | null | undefined): boolean {
  if (!graceUntil) return false;
  const date = new Date(graceUntil);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

function EnrollmentRow({
  item,
  timezone,
  canEditAccess,
  canPromoteToMember,
  canDemoteToNewbie,
  promotePending,
  demotePending,
  onEditAccess,
  onPromoteToMember,
  onDemoteToNewbie,
}: {
  item: ProgramHistoryItem;
  timezone: string;
  canEditAccess?: boolean;
  canPromoteToMember?: boolean;
  canDemoteToNewbie?: boolean;
  promotePending?: boolean;
  demotePending?: boolean;
  onEditAccess?: (item: ProgramHistoryItem) => void;
  onPromoteToMember?: (item: ProgramHistoryItem) => void;
  onDemoteToNewbie?: (item: ProgramHistoryItem) => void;
}) {
  const renew = autoRenewInfo(item);
  const activeFrom = formatMembershipDate(item.startsOn ?? item.date, timezone);
  const activeUntil = formatMembershipDate(item.accessUntil, timezone);
  const showGrace = isGraceOpen(item.graceUntil);
  const hasMembershipWindow = Boolean(item.startsOn || item.accessUntil);
  const showPromote = Boolean(canPromoteToMember && onPromoteToMember && item.phase === 'initial');
  const showDemote = Boolean(canDemoteToNewbie && onDemoteToNewbie && item.phase === 'monthly' && item.drivesLifecycle);

  return (
    <article className="border-t border-slate-100 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{item.program}</h3>
            <Pill tone={enrollmentStatusTone(item.status)}>{item.status}</Pill>
            {renew ? <Pill tone={renew.tone}>Auto-renew {renew.label}</Pill> : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.batch}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 tabular-nums">{label(item.amount)}</p>
          {item.promoCode ? (
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Promo {item.promoCode}</p>
          ) : null}
        </div>
      </div>

      {hasMembershipWindow ? (
        <div className="mt-3 rounded-xl bg-canvas-cool px-3.5 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Membership window</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                <span className="text-slate-500">Active from</span> {activeFrom}
                <span className="mx-2 text-slate-300">→</span>
                <span className="text-slate-500">Active until</span> {activeUntil}
              </p>
              {showGrace ? (
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  Grace until {formatMembershipDate(item.graceUntil, timezone)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {showPromote ? (
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  leftIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                  loading={promotePending}
                  onClick={() => onPromoteToMember?.(item)}
                >
                  Convert to member
                </Button>
              ) : null}
              {showDemote ? (
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  leftIcon={<ArrowDownRight className="h-3.5 w-3.5" />}
                  loading={demotePending}
                  onClick={() => onDemoteToNewbie?.(item)}
                >
                  Downgrade to newbie
                </Button>
              ) : null}
              {canEditAccess && onEditAccess ? (
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  leftIcon={<CalendarRange className="h-3.5 w-3.5" />}
                  onClick={() => onEditAccess(item)}
                >
                  Edit access
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {showPromote ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              leftIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              loading={promotePending}
              onClick={() => onPromoteToMember?.(item)}
            >
              Convert to member
            </Button>
          ) : null}
          {showDemote ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              leftIcon={<ArrowDownRight className="h-3.5 w-3.5" />}
              loading={demotePending}
              onClick={() => onDemoteToNewbie?.(item)}
            >
              Downgrade to newbie
            </Button>
          ) : null}
          {canEditAccess && onEditAccess ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              leftIcon={<CalendarRange className="h-3.5 w-3.5" />}
              onClick={() => onEditAccess(item)}
            >
              Set access until
            </Button>
          ) : null}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
        {item.phase ? (
          <div>
            <dt className="text-slate-400">Phase</dt>
            <dd className="font-semibold text-slate-700 capitalize">{item.phase}</dd>
          </div>
        ) : null}
        {item.subscriptionStatus ? (
          <div>
            <dt className="text-slate-400">Subscription</dt>
            <dd className="font-semibold text-slate-700 capitalize">{item.subscriptionStatus}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-400">Enrolled / paid</dt>
          <dd className="font-semibold text-slate-700">{label(item.date)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ProgramHistory({
  items,
  interest,
  batch,
  attribution,
  leadId,
  canEditAccess = false,
  canPromoteToMember = false,
  canDemoteToNewbie = false,
}: ProgramHistoryProps) {
  const router = useRouter();
  const { toast } = useToast();
  const timezone = useDisplayTimezone();
  const [editItem, setEditItem] = useState<ProgramHistoryItem | null>(null);
  const [promotePendingId, setPromotePendingId] = useState<string | null>(null);
  const [promotePending, startPromote] = useTransition();
  const [demotePendingId, setDemotePendingId] = useState<string | null>(null);
  const [demotePending, startDemote] = useTransition();
  const showSummary = Boolean(interest?.trim() || batch?.trim() || attribution);
  const formLabel = attribution ? attributionFormLabel(attribution) : null;

  const handlePromote = (item: ProgramHistoryItem) => {
    if (!leadId) return;
    const confirmed = window.confirm(
      `Convert this enrollment to monthly phase? The lead stage will sync to Member if they are currently a Newbie.`
    );
    if (!confirmed) return;
    setPromotePendingId(item.id);
    startPromote(async () => {
      const { result, error } = await promoteLeadToMemberAction(leadId, item.id);
      setPromotePendingId(null);
      if (error || !result) {
        toast({ message: error ?? 'Failed to convert to member.', variant: 'error' });
        return;
      }
      toast({
        message: result.stage
          ? `Converted to member. Stage is now ${result.stage}.`
          : 'Converted enrollment to monthly phase.',
        variant: 'success',
      });
      router.refresh();
    });
  };

  const handleDemote = (item: ProgramHistoryItem) => {
    if (!leadId) return;
    const confirmed = window.confirm(
      'Downgrade this enrollment to newbie (initial phase)? Access end date will not change, and stage-changed automations will not run.'
    );
    if (!confirmed) return;
    setDemotePendingId(item.id);
    startDemote(async () => {
      const { result, error } = await demoteLeadToNewbieAction(leadId, item.id);
      setDemotePendingId(null);
      if (error || !result) {
        toast({ message: error ?? 'Failed to downgrade to newbie.', variant: 'error' });
        return;
      }
      toast({
        message: `Downgraded to newbie. Stage is now ${result.stage}.`,
        variant: 'success',
      });
      router.refresh();
    });
  };

  return (
    <Card padding="none" className="w-full">
      <div className="p-5">
        <SectionHead title="Programs & payments" subtitle="Interest, source, and membership history" />
        {showSummary ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm [&>div]:min-w-0">
            <div>
              <dt className="text-slate-500">Program interest</dt>
              <dd className="font-semibold wrap-break-word text-slate-800">{label(interest)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Batch</dt>
              <dd className="font-semibold wrap-break-word text-slate-800">{label(batch)}</dd>
            </div>
            {attribution ? (
              <>
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-semibold wrap-break-word text-slate-800">
                    {attributionSourceLabel(attribution)}
                  </dd>
                </div>
                {formLabel ? (
                  <div>
                    <dt className="text-slate-500">Form</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{formLabel}</dd>
                  </div>
                ) : attribution.campaign ? (
                  <div>
                    <dt className="text-slate-500">Campaign</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.campaign}</dd>
                  </div>
                ) : null}
                {attribution.utmSource ? (
                  <div>
                    <dt className="text-slate-500">UTM source</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.utmSource}</dd>
                  </div>
                ) : null}
                {attribution.utmMedium ? (
                  <div>
                    <dt className="text-slate-500">UTM medium</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.utmMedium}</dd>
                  </div>
                ) : null}
                {attribution.utmCampaign ? (
                  <div>
                    <dt className="text-slate-500">UTM campaign</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.utmCampaign}</dd>
                  </div>
                ) : null}
                {attribution.utmContent ? (
                  <div>
                    <dt className="text-slate-500">UTM content</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.utmContent}</dd>
                  </div>
                ) : null}
                {attribution.utmTerm ? (
                  <div>
                    <dt className="text-slate-500">UTM term</dt>
                    <dd className="font-semibold wrap-break-word text-slate-800">{attribution.utmTerm}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-slate-500">No enrollments yet.</p>
      ) : (
        <div>
          {items.map((item) => (
            <EnrollmentRow
              key={item.id}
              item={item}
              timezone={timezone}
              canEditAccess={canEditAccess}
              canPromoteToMember={canPromoteToMember}
              canDemoteToNewbie={canDemoteToNewbie}
              promotePending={promotePending && promotePendingId === item.id}
              demotePending={demotePending && demotePendingId === item.id}
              onEditAccess={canEditAccess ? setEditItem : undefined}
              onPromoteToMember={canPromoteToMember ? handlePromote : undefined}
              onDemoteToNewbie={canDemoteToNewbie ? handleDemote : undefined}
            />
          ))}
        </div>
      )}
      {leadId && canEditAccess ? (
        <EditMembershipAccessDialog
          leadId={leadId}
          item={editItem}
          open={editItem !== null}
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
        />
      ) : null}
    </Card>
  );
}
