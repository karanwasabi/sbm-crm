'use client';

import { useTransition } from 'react';
import { resetLeadOnboardingPointAAction } from '@/app/(crm)/customers/actions';
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

type ResetOnboardingPointADialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function ResetOnboardingPointADialog({ leadId, open, onOpenChange, onDone }: ResetOnboardingPointADialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (pending) return;
    startTransition(async () => {
      const { result, error } = await resetLeadOnboardingPointAAction(leadId);
      if (error || !result) {
        toast({ message: error ?? 'Failed to reset onboarding and Point A.', variant: 'error' });
        return;
      }
      toast({
        message: 'Onboarding & Point A reset. Member must redo full profile onboarding (prefilled), then Point A.',
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">Reset onboarding & Point A?</DialogTitle>
          <DialogDescription className="sr-only">
            Confirm clearing onboarding completion and Point A for this member
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-5 text-sm leading-relaxed text-slate-600">
          <p>
            This sends the member through <span className="font-semibold text-slate-800">full profile onboarding</span>{' '}
            again (existing profile values stay as prefills), then Point A.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Clears onboarding completion and Point A assessment</li>
            <li>Deletes all weight logs, habit goals, and nutrition servings</li>
            <li>Clears saved meal plans and Point A lifestyle scores</li>
          </ul>
          <p className="font-medium text-amber-800">
            Check-in history is kept. Weight history and goals are not recoverable.
          </p>
        </div>
        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={pending}
            loadingLabel="Resetting…"
            onClick={handleConfirm}
          >
            Reset onboarding & Point A
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
