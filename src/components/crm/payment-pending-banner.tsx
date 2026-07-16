import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatInrFromPaise } from '@/lib/money';
import type { PaymentPending } from '@/types/crm';

type PaymentPendingBannerProps = {
  paymentPending: PaymentPending;
  onMarkPaidOffline?: () => void;
  markingPaidOffline?: boolean;
};

export function PaymentPendingBanner({
  paymentPending,
  onMarkPaidOffline,
  markingPaidOffline,
}: PaymentPendingBannerProps) {
  return (
    <Card className="border-[#FFB703]/40 bg-[#FFFBEB] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#92400E] uppercase">Payment pending</div>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {paymentPending.programName} · {paymentPending.cohortName}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Checkout was started but payment has not completed yet ({formatInrFromPaise(paymentPending.amountPaise)}{' '}
            due). See timeline for checkout attempts.
          </p>
        </div>
        {onMarkPaidOffline ? (
          <Button
            type="button"
            variant="light"
            size="sm"
            disabled={markingPaidOffline}
            onClick={onMarkPaidOffline}
            className="shrink-0"
          >
            {markingPaidOffline ? 'Marking…' : 'Mark paid (offline)'}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
