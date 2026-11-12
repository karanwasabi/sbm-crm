'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelLeadMembershipAutopayAction } from '@/app/(crm)/customers/actions';
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
import { formatInclusiveAccessEndDate } from '@/lib/access-until-display';
import type { ProgramHistoryItem } from '@/types/crm';

type CancelAutopayDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelAutopayDialog({ leadId, item, open, onOpenChange }: CancelAutopayDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const accessUntilLabel = item?.accessUntil ? formatInclusiveAccessEndDate(item.accessUntil) : null;

  const submit = () => {
    if (!item) return;
    startTransition(async () => {
      const { result, error } = await cancelLeadMembershipAutopayAction(leadId, item.id);
      if (error || !result) {
        toast({ message: error ?? 'Failed to cancel autopay.', variant: 'error' });
        return;
      }
      const until = result.accessUntil ? formatInclusiveAccessEndDate(result.accessUntil) : accessUntilLabel;
      toast({
        message: until
          ? `Autopay cancelled. Access continues until ${until}.`
          : 'Autopay cancelled. Access continues through the current period.',
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
          <DialogTitle>Cancel autopay</DialogTitle>
          <DialogDescription>
            {item
              ? `Turns off auto-renew for ${item.program} · ${item.batch}. Membership access stays until the current period ends.`
              : 'Turn off auto-renew while keeping current membership access.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Razorpay mandate is cancelled at the end of the billing cycle (same as the member portal).</li>
          <li>Access continues{accessUntilLabel ? ` until ${accessUntilLabel}` : ' through the current period'}.</li>
          <li>Lead stage is unchanged. They can still renew later from the portal.</li>
        </ul>

        <DialogFooter>
          <Button type="button" variant="light" disabled={pending} onClick={() => onOpenChange(false)}>
            Keep autopay
          </Button>
          <Button type="button" variant="danger" loading={pending} disabled={!item || pending} onClick={submit}>
            Cancel autopay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
