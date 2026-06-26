import { cn } from '@/lib/cn';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import type { MarketingContactStatus } from '@/types/crm';

const STATUS_STYLES: Record<MarketingContactStatus, string> = {
  not_applicable: 'bg-slate-100 text-slate-600',
  no_consent: 'bg-amber-100 text-amber-800',
  eligible: 'bg-sky-100 text-sky-800',
  active: 'bg-success-press/10 text-success-press',
  unsubscribed: 'bg-slate-200 text-slate-700',
};

type MarketingContactBadgeProps = {
  status: MarketingContactStatus;
  className?: string;
};

export function MarketingContactBadge({ status, className }: MarketingContactBadgeProps) {
  const label = MARKETING_CONTACT_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
        STATUS_STYLES[status],
        className
      )}
    >
      {label}
    </span>
  );
}
