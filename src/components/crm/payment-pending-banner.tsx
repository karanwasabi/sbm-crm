import { Card } from '@/components/ui/card';
import { formatInrFromPaise } from '@/lib/money';
import type { PaymentPending } from '@/types/crm';

type PaymentPendingBannerProps = {
  paymentPending: PaymentPending;
};

export function PaymentPendingBanner({ paymentPending }: PaymentPendingBannerProps) {
  return (
    <Card className="border-[#FFB703]/40 bg-[#FFFBEB] p-4">
      <div className="text-[10px] font-bold tracking-[0.14em] text-[#92400E] uppercase">Payment pending</div>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {paymentPending.programName} · {paymentPending.cohortName}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Checkout was started but payment has not completed yet ({formatInrFromPaise(paymentPending.amountPaise)} due).
        See timeline for checkout attempts.
      </p>
    </Card>
  );
}
