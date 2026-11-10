'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelLeadMembershipOfflineRefundAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { ProgramHistoryItem } from '@/types/crm';

type MarkLostOfflineRefundDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MarkLostOfflineRefundDialog({ leadId, item, open, onOpenChange }: MarkLostOfflineRefundDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!item) return;
    startTransition(async () => {
      const { result, error } = await cancelLeadMembershipOfflineRefundAction(leadId, item.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to mark lost with offline refund.', variant: 'error' });
        return;
      }
      const amount =
        result.refundAmountPaise > 0
          ? ` Offline refund logged for ₹${(result.refundAmountPaise / 100).toLocaleString('en-IN')}.`
          : ' Offline refund logged.';
      const razorpayNote = result.razorpayCancelled ? ' Razorpay mandate cancelled.' : '';
      toast({
        message: `Membership ended. Stage is Lost.${amount}${razorpayNote}`,
        variant: 'success',
      });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Mark lost · offline refund</DialogTitle>
          <DialogDescription>
            {item
              ? `Ends ${item.program} · ${item.batch} immediately. Use when an offline refund was already issued and the member is cancelling.`
              : 'End membership immediately after an offline refund.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Access ends now (today UTC). Grace is cleared.</li>
          <li>Any Razorpay auto-renew mandate is cancelled immediately.</li>
          <li>Lead stage becomes Lost and stays there.</li>
          <li>
            Activity timeline records an offline refund for the last payment{item?.amount ? ` (${item.amount})` : ''}.
          </li>
        </ul>

        <DialogFooter>
          <Button type="button" variant="light" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={pending} disabled={!item || pending} onClick={submit}>
            Mark lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
