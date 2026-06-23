import type { ReactNode } from 'react';
import { DataTableCell, DataTableHeaderCell } from '@/components/crm/data-table';
import { cn } from '@/lib/cn';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import { formatPromoDiscount, promoDiscountTypeLabel } from '@/lib/promo-discount';

const usageCountColumnClass = 'px-3 text-center tabular-nums';

export function PromoUsageCountHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <DataTableHeaderCell className={cn(usageCountColumnClass, className)}>{children}</DataTableHeaderCell>;
}

export function PromoUsageCountCell({ children, className }: { children: ReactNode; className?: string }) {
  return <DataTableCell className={cn(usageCountColumnClass, className)}>{children}</DataTableCell>;
}

type PromoOfferDisplayProps = {
  discountType: string | undefined;
  discountValue: number | null | undefined;
  showCurrent?: boolean;
};

export function PromoOfferDisplay({ discountType, discountValue, showCurrent }: PromoOfferDisplayProps) {
  return (
    <div className="space-y-0.5">
      <div className="text-sm font-semibold text-slate-800">{formatPromoDiscount(discountType, discountValue)}</div>
      {discountType ? <div className="text-xs text-slate-500">{promoDiscountTypeLabel(discountType)}</div> : null}
      {showCurrent ? <div className="text-[11px] font-medium text-brand">Current</div> : null}
    </div>
  );
}

type PromoWindowDisplayProps = {
  startsAt: string | null | undefined;
  endsAt?: string | null;
};

export function PromoWindowDisplay({ startsAt, endsAt }: PromoWindowDisplayProps) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Start</dt>
        <dd className="text-slate-700 tabular-nums">{formatDateTimeIST(startsAt)}</dd>
        <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">End</dt>
        <dd className="text-slate-700 tabular-nums">{endsAt ? formatDateTimeIST(endsAt) : 'Open-ended'}</dd>
      </div>
    </dl>
  );
}
