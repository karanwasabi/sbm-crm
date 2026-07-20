'use client';

import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { applyMembershipTransferAction, previewMembershipTransferAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import type {
  MembershipTransferOverwriteField,
  MembershipTransferOverwriteFlags,
  MembershipTransferPreviewResponse,
} from '@/types/crm';

type MembershipTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onTransferred: () => void;
};

const EMPTY_OVERWRITE: MembershipTransferOverwriteFlags = {
  first_name: false,
  last_name: false,
  email: false,
  whatsapp: false,
};

const OVERWRITE_LABELS: Record<MembershipTransferOverwriteField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

const MATCH_LABELS: Record<MembershipTransferPreviewResponse['match'], string> = {
  none: 'No existing lead or user — a new recipient will be created.',
  lead_only: 'Existing lead found (no linked user yet).',
  user_only: 'Existing user found (no matching lead yet).',
  lead_and_user: 'Existing lead and user found.',
};

function emptyForm() {
  return { firstName: '', lastName: '', email: '', whatsapp: '' };
}

export function MembershipTransferDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onTransferred,
}: MembershipTransferDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<MembershipTransferPreviewResponse | null>(null);
  const [overwrite, setOverwrite] = useState<MembershipTransferOverwriteFlags>(EMPTY_OVERWRITE);
  const [resolveRazorpayConflict, setResolveRazorpayConflict] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [applying, startApply] = useTransition();

  useEffect(() => {
    if (!open) {
      setStep('form');
      setForm(emptyForm());
      setPreview(null);
      setOverwrite(EMPTY_OVERWRITE);
      setResolveRazorpayConflict(false);
      setFormError(null);
      setSubmitError(null);
    }
  }, [open]);

  const conflictedFields = useMemo(() => {
    if (!preview) return [] as MembershipTransferOverwriteField[];
    return (Object.keys(preview.overwriteCandidates) as MembershipTransferOverwriteField[]).filter(
      (field) => preview.overwriteCandidates[field].conflict
    );
  }, [preview]);

  const idleRazorpayConflict = preview?.razorpayConflict?.status === 'idle';
  const liveRazorpayConflict = preview?.razorpayConflict?.status === 'live';
  const existingMatch = preview != null && preview.match !== 'none';

  const canConfirm =
    preview != null &&
    preview.canApply &&
    preview.blockingErrors.length === 0 &&
    !liveRazorpayConflict &&
    (!idleRazorpayConflict || resolveRazorpayConflict);

  const handlePreview = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const whatsapp = form.whatsapp.trim();
    if (!firstName || !email || !whatsapp) {
      setFormError('First name, email, and WhatsApp are required.');
      return;
    }

    setFormError(null);
    setSubmitError(null);
    startPreview(async () => {
      const result = await previewMembershipTransferAction(leadId, {
        firstName,
        lastName,
        email,
        whatsapp,
      });
      if (result.error || !result.preview) {
        setFormError(result.error ?? 'Failed to preview membership transfer.');
        return;
      }

      const nextOverwrite: MembershipTransferOverwriteFlags = { ...EMPTY_OVERWRITE };
      (Object.keys(result.preview.overwriteCandidates) as MembershipTransferOverwriteField[]).forEach((field) => {
        nextOverwrite[field] = result.preview!.overwriteCandidates[field].conflict;
      });
      setOverwrite(nextOverwrite);
      setResolveRazorpayConflict(false);
      setPreview(result.preview);
      setStep('preview');
    });
  };

  const handleApply = () => {
    if (!preview || !canConfirm) return;
    setSubmitError(null);
    startApply(async () => {
      const result = await applyMembershipTransferAction(leadId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        overwrite,
        confirmExisting: existingMatch,
        resolveRazorpayConflict: idleRazorpayConflict ? resolveRazorpayConflict : false,
      });

      if (result.error || !result.result || result.result.status === 'failed') {
        const failed = result.result;
        const parts = [
          result.error ?? failed?.error ?? 'Membership transfer failed.',
          failed?.rolledBack ? 'Changes were rolled back.' : null,
          failed?.razorpayErrors?.length ? failed.razorpayErrors.join(' ') : null,
        ].filter(Boolean);
        setSubmitError(parts.join(' '));
        return;
      }

      toast({
        message: 'Membership transferred. Set a password for the recipient before they log in.',
        variant: 'success',
      });
      onOpenChange(false);
      onTransferred();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ArrowRightLeft className="h-5 w-5 text-brand" aria-hidden />
            Transfer membership
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-600">
            Move membership from <span className="font-semibold text-slate-800">{leadName}</span> to a new recipient.
            App access ends for the donor; portal login may still work. The recipient gets no invite email — ops must
            set their password.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {step === 'form' ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name">
                  <TextInput
                    value={form.firstName}
                    onChange={(value) => {
                      setForm((prev) => ({ ...prev, firstName: value }));
                      setFormError(null);
                    }}
                    disabled={previewing}
                    autoComplete="off"
                  />
                </Field>
                <Field label="Last name">
                  <TextInput
                    value={form.lastName}
                    onChange={(value) => {
                      setForm((prev) => ({ ...prev, lastName: value }));
                      setFormError(null);
                    }}
                    disabled={previewing}
                    autoComplete="off"
                  />
                </Field>
              </div>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, email: value }));
                    setFormError(null);
                  }}
                  disabled={previewing}
                  autoComplete="off"
                />
              </Field>
              <Field label="WhatsApp">
                <TextInput
                  value={form.whatsapp}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, whatsapp: value }));
                    setFormError(null);
                  }}
                  disabled={previewing}
                  autoComplete="off"
                  placeholder="+91…"
                />
              </Field>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            </>
          ) : preview ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-800">Match</div>
                <p className="mt-1">{MATCH_LABELS[preview.match]}</p>
                {preview.donor.cohortName ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Cohort · {preview.donor.cohortName}
                    {preview.donor.accessUntil ? ` · access until ${preview.donor.accessUntil}` : ''}
                  </p>
                ) : null}
              </div>

              {conflictedFields.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Overwrite conflicted fields
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-200 px-3.5 py-3">
                    {conflictedFields.map((field) => {
                      const candidate = preview.overwriteCandidates[field];
                      return (
                        <Checkbox
                          key={field}
                          checked={overwrite[field]}
                          onChange={(checked) => setOverwrite((prev) => ({ ...prev, [field]: checked }))}
                          disabled={applying}
                          label={
                            <span>
                              {OVERWRITE_LABELS[field]}:{' '}
                              <span className="font-normal text-slate-500">
                                {candidate.current || '—'} → {candidate.proposed || '—'}
                              </span>
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {preview.razorpayConflict ? (
                <div
                  className={`space-y-2 rounded-xl border px-3.5 py-3 ${
                    liveRazorpayConflict ? 'border-red-200 bg-red-50/70' : 'border-amber-200 bg-amber-50/70'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">Razorpay customer conflict</div>
                  <p className="text-sm text-slate-700">
                    Customer <span className="font-mono text-xs">{preview.razorpayConflict.customerId}</span> is{' '}
                    {preview.razorpayConflict.status}
                    {preview.razorpayConflict.message ? ` — ${preview.razorpayConflict.message}` : '.'}
                  </p>
                  {idleRazorpayConflict ? (
                    <Checkbox
                      checked={resolveRazorpayConflict}
                      onChange={setResolveRazorpayConflict}
                      disabled={applying}
                      label="Park the idle Razorpay customer so this transfer can update the donor customer contact"
                    />
                  ) : (
                    <p className="text-sm text-red-700">
                      Live subscription conflict — use a different email/WhatsApp, or resolve the other membership
                      first.
                    </p>
                  )}
                </div>
              ) : null}

              {preview.blockingErrors.length > 0 ? (
                <ul className="space-y-1 text-sm text-red-600">
                  {preview.blockingErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}

              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading preview…
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          {step === 'preview' ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              className="min-w-[5.5rem]"
              onClick={() => {
                setStep('form');
                setSubmitError(null);
              }}
              disabled={applying}
            >
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="light"
              size="sm"
              className="min-w-[5.5rem]"
              onClick={() => onOpenChange(false)}
              disabled={previewing}
            >
              Cancel
            </Button>
          )}
          {step === 'form' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-[8.75rem]"
              loading={previewing}
              loadingLabel="Checking…"
              disabled={previewing}
              onClick={handlePreview}
            >
              Preview
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-[8.75rem]"
              loading={applying}
              loadingLabel="Transferring…"
              disabled={!canConfirm || applying}
              onClick={handleApply}
            >
              Confirm transfer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
