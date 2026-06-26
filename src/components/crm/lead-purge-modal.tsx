'use client';

import { useEffect, useState, useTransition } from 'react';
import { purgeLeadAction, getLeadPurgePreviewAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { LeadPurgePreview } from '@/utils/api';

type LeadPurgeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadEmail: string;
  leadName: string;
  hasMemberAccount: boolean;
  onPurged: () => void;
};

function purgeReasonPlaceholder(hasMemberAccount: boolean) {
  if (hasMemberAccount) {
    return 'Test member cleanup after signup or billing QA';
  }
  return 'Duplicate or invalid inquiry — remove from CRM';
}

function purgeDescription(hasMemberAccount: boolean) {
  if (hasMemberAccount) {
    return 'Deletes this lead, linked billing, and the member portal account. This cannot be undone.';
  }
  return 'Deletes this lead from the CRM. No member account is linked. This cannot be undone.';
}

export function LeadPurgeModal({
  open,
  onOpenChange,
  leadId,
  leadEmail,
  leadName,
  hasMemberAccount,
  onPurged,
}: LeadPurgeModalProps) {
  const [preview, setPreview] = useState<LeadPurgePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingPreview, startPreview] = useTransition();
  const [purging, startPurge] = useTransition();

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewError(null);
      setReason('');
      setConfirmationEmail('');
      setSubmitError(null);
      return;
    }

    startPreview(async () => {
      const result = await getLeadPurgePreviewAction(leadId);
      if (result.error) {
        setPreview(null);
        setPreviewError(result.error);
        return;
      }
      setPreview(result.preview);
      setPreviewError(null);
    });
  }, [open, leadId]);

  const reasonValid = reason.trim().length >= 10;
  const emailMatches = confirmationEmail.trim().toLowerCase() === leadEmail.trim().toLowerCase();
  const hasBlockers = (preview?.blockers.length ?? 0) > 0;
  const needsTestTag = Boolean(preview?.is_production && !preview.has_test_signal);
  const canSubmit = reasonValid && emailMatches && !hasBlockers && !needsTestTag && !loadingPreview && !purging;
  const hasMember = preview ? Boolean(preview.member_user_id) : hasMemberAccount;
  const showImpact =
    preview &&
    (hasBlockers ||
      needsTestTag ||
      (hasMember &&
        (preview.enrollment_count > 0 ||
          preview.invoice_count > 0 ||
          preview.checkout_sessions > 0 ||
          preview.razorpay_subscription_ids.length > 0)));

  const handlePurge = () => {
    setSubmitError(null);
    startPurge(async () => {
      const result = await purgeLeadAction(leadId, {
        confirmationEmail: confirmationEmail.trim(),
        reason: reason.trim(),
      });
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      onOpenChange(false);
      onPurged();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">Delete Lead</DialogTitle>
          <DialogDescription className="sr-only">
            {hasMember
              ? `Permanently purge ${leadName} and linked member data`
              : `Permanently delete CRM lead ${leadName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-6 py-5">
          <p className="text-sm text-slate-600">{purgeDescription(hasMember)}</p>

          {loadingPreview ? <p className="text-sm text-slate-500">Checking…</p> : null}
          {previewError ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>
          ) : null}

          {showImpact ? (
            <div className="space-y-2 rounded-2xl border border-slate-100 bg-canvas-cool/60 p-4 text-sm text-slate-700">
              {hasMember && !hasBlockers && !needsTestTag ? <p>Includes member account and billing data.</p> : null}
              {needsTestTag ? (
                <p className="font-semibold text-amber-800">
                  Cannot delete in production. Mark this lead as a test account first.
                </p>
              ) : null}
              {preview?.blockers.map((blocker) => (
                <p key={blocker} className="font-semibold text-red-700">
                  {blocker}
                </p>
              ))}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wide text-slate-500 uppercase" htmlFor="purge-reason">
              Reason
            </label>
            <textarea
              id="purge-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder={purgeReasonPlaceholder(hasMember)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wide text-slate-500 uppercase" htmlFor="purge-email">
              Type email to confirm
            </label>
            <Input
              id="purge-email"
              value={confirmationEmail}
              onChange={(event) => setConfirmationEmail(event.target.value)}
              placeholder={leadEmail}
              autoComplete="off"
            />
          </div>

          {submitError ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" disabled={purging} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={purging}
            loadingLabel="Deleting…"
            disabled={!canSubmit}
            onClick={handlePurge}
          >
            Delete Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
