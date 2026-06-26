'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AutomationConfirmAction = 'archive' | 'delete' | 'deactivate';

type ButtonVariant = 'primary' | 'danger' | 'amber';

type AutomationConfirmDialogProps = {
  action: AutomationConfirmAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationName: string;
  pending?: boolean;
  onConfirm: () => void;
};

const ACTION_COPY: Record<
  AutomationConfirmAction,
  {
    title: string;
    srDescription: string;
    body: (name: string) => ReactNode;
    confirmLabel: string;
    loadingLabel: string;
    confirmVariant: ButtonVariant;
  }
> = {
  archive: {
    title: 'Archive workflow?',
    srDescription: 'Confirm archiving this inactive automation workflow',
    body: (name) => (
      <>
        Archive <span className="font-semibold text-slate-800">{name}</span>? It will be hidden from the automations
        list. Enrollment history is preserved.
      </>
    ),
    confirmLabel: 'Archive workflow',
    loadingLabel: 'Archiving…',
    confirmVariant: 'primary',
  },
  delete: {
    title: 'Delete draft?',
    srDescription: 'Confirm permanent deletion of this automation draft',
    body: (name) => (
      <>
        Permanently delete draft <span className="font-semibold text-slate-800">{name}</span>? This action cannot be
        undone.
      </>
    ),
    confirmLabel: 'Delete draft',
    loadingLabel: 'Deleting…',
    confirmVariant: 'danger',
  },
  deactivate: {
    title: 'Deactivate workflow?',
    srDescription: 'Confirm deactivating this active automation workflow',
    body: (name) => (
      <>
        Deactivate <span className="font-semibold text-slate-800">{name}</span>? New leads will not enroll until you
        activate it again.
      </>
    ),
    confirmLabel: 'Deactivate',
    loadingLabel: 'Deactivating…',
    confirmVariant: 'amber',
  },
};

export function AutomationConfirmDialog({
  action,
  open,
  onOpenChange,
  automationName,
  pending = false,
  onConfirm,
}: AutomationConfirmDialogProps) {
  const copy = ACTION_COPY[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">{copy.title}</DialogTitle>
          <DialogDescription className="sr-only">{copy.srDescription}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-600">{copy.body(automationName)}</p>
        </div>
        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.confirmVariant}
            size="sm"
            loading={pending}
            loadingLabel={copy.loadingLabel}
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
