'use client';

import { AlertTriangle, Info, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { purgeLeadAction, getLeadPurgePreviewAction } from '@/app/(crm)/customers/actions';
import { Skeleton } from '@/components/loading/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
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
    return (
      <>
        Deletes this <span className="font-semibold text-slate-800">lead</span>, linked{' '}
        <span className="font-semibold text-slate-800">billing</span>, and the{' '}
        <span className="font-semibold text-slate-800">member portal account</span>.{' '}
        <span className="font-semibold text-slate-800">Cannot be undone.</span>
      </>
    );
  }
  return (
    <>
      Deletes this <span className="font-semibold text-slate-800">lead</span> from the CRM. No member account is linked.{' '}
      <span className="font-semibold text-slate-800">Cannot be undone.</span>
    </>
  );
}

function PurgeInfoLoading({ hasMemberAccount }: { hasMemberAccount: boolean }) {
  if (hasMemberAccount) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <div className="flex gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-500">
          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" aria-hidden />
          <span>Checking what will be affected…</span>
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <p className="flex items-start gap-2 text-sm text-slate-600" aria-busy="true" aria-live="polite">
      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" aria-hidden />
      <span className="text-slate-500">Checking what will be affected…</span>
    </p>
  );
}

function PurgeInputSkeleton({ hasMemberAccount }: { hasMemberAccount: boolean }) {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      {hasMemberAccount ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-36 rounded-md" />
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      ) : null}
    </div>
  );
}

function PurgeProtectedAccountNotice() {
  return (
    <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
      <p>
        <span className="font-semibold">Account is protected.</span> Add the <span className="font-semibold">test</span>{' '}
        tag before deleting.
      </p>
    </div>
  );
}

function PurgeInfoContent({
  hasMember,
  previewError,
  preview,
}: {
  hasMember: boolean;
  previewError: string | null;
  preview: LeadPurgePreview | null;
}) {
  const blockers = preview?.blockers ?? [];

  return (
    <div className="space-y-3">
      {hasMember ? (
        <div className="space-y-2">
          <div className="flex gap-2 rounded-xl border border-danger-press/20 bg-danger/5 px-3 py-2.5 text-sm text-danger-press">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <p>
              Deletes this <span className="font-semibold">lead</span>, <span className="font-semibold">billing</span>,
              and the <span className="font-semibold">member account</span>.{' '}
              <span className="font-semibold">Cannot be undone.</span>
            </p>
          </div>
          <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
            <p>
              <span className="font-semibold">Subscription will be cancelled.</span> A{' '}
              <span className="font-semibold">refund</span> may be owed.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{purgeDescription(hasMember)}</p>
      )}

      {previewError ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>
      ) : null}

      {blockers.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {blockers.map((blocker) => (
            <p key={blocker} className="font-semibold">
              {blocker}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
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

  const reasonValid = reason.trim().length > 0;
  const emailMatches = confirmationEmail.trim().toLowerCase() === leadEmail.trim().toLowerCase();
  const hasBlockers = (preview?.blockers.length ?? 0) > 0;
  const blockedByTestTag = Boolean(preview?.is_production && !preview.has_test_signal);
  const showTestTagNotice = blockedByTestTag;
  const hasMember = preview ? Boolean(preview.member_user_id) : hasMemberAccount;
  const emailConfirmValid = hasMember ? emailMatches : true;
  const canSubmit =
    reasonValid && emailConfirmValid && !hasBlockers && !showTestTagNotice && !loadingPreview && !purging;
  const showMemberLayout = loadingPreview ? hasMemberAccount : hasMember;

  const handlePurge = () => {
    setSubmitError(null);
    startPurge(async () => {
      const result = await purgeLeadAction(leadId, {
        confirmationEmail: hasMember ? confirmationEmail.trim() : leadEmail.trim(),
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
            {showMemberLayout
              ? `Permanently purge ${leadName} and linked member data`
              : `Permanently delete CRM lead ${leadName}`}
          </DialogDescription>
        </DialogHeader>

        <section className="border-b border-slate-100 bg-canvas-cool/60 px-6 py-4">
          {loadingPreview ? (
            <PurgeInfoLoading hasMemberAccount={hasMemberAccount} />
          ) : (
            <div className="animate-in duration-200 fade-in">
              <PurgeInfoContent hasMember={hasMember} previewError={previewError} preview={preview} />
            </div>
          )}
        </section>

        <section className="max-h-[min(50vh,360px)] overflow-y-auto px-6 py-5">
          {loadingPreview ? (
            <PurgeInputSkeleton hasMemberAccount={hasMemberAccount} />
          ) : (
            <div className="relative animate-in duration-200 fade-in">
              <div
                className={showTestTagNotice ? 'pointer-events-none invisible space-y-4' : 'space-y-4'}
                aria-hidden={showTestTagNotice}
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wide text-slate-500 uppercase" htmlFor="purge-reason">
                    Reason
                  </label>
                  <Textarea
                    id="purge-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                    placeholder={purgeReasonPlaceholder(hasMember)}
                    tabIndex={showTestTagNotice ? -1 : undefined}
                    className="resize-none rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.25 text-sm font-medium text-slate-800 outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
                  />
                </div>

                {hasMember ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-bold tracking-wide text-slate-500 uppercase" htmlFor="purge-email">
                        Confirm email
                      </label>
                      <code className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                        {leadEmail}
                      </code>
                    </div>
                    <TextInput
                      id="purge-email"
                      value={confirmationEmail}
                      onChange={setConfirmationEmail}
                      placeholder="Type the email above"
                      autoComplete="off"
                      tabIndex={showTestTagNotice ? -1 : undefined}
                    />
                  </div>
                ) : null}

                {submitError ? (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </p>
                ) : null}
              </div>

              {showTestTagNotice ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <PurgeProtectedAccountNotice />
                </div>
              ) : null}
            </div>
          )}
        </section>

        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="light"
            size="sm"
            disabled={purging || loadingPreview}
            onClick={() => onOpenChange(false)}
          >
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
