'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { requestPasswordReset, type ForgotPasswordState } from '@/app/(auth)/forgot-password/actions';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { cn } from '@/lib/cn';
import { forgotPasswordMessages } from '@/lib/forgot-password-messages';

const initialState: ForgotPasswordState = { error: null, success: false };

const SUCCESS_CONTENT_MIN_H = 'min-h-48';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const success = state.success;
  const submittedEmail = state.email ?? email;

  useEffect(() => {
    if (wasPending.current && !isPending) {
      setDisplayError(state.error);
      if (state.error) {
        emailRef.current?.focus();
      }
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const clearError = () => {
    if (displayError) setDisplayError(null);
  };

  return (
    <AuthLayout>
      <div className="mb-7 min-h-14">
        {success ? (
          <div aria-hidden className="invisible">
            <SbmWordmark size="lg" />
          </div>
        ) : (
          <SbmWordmark size="lg" />
        )}
      </div>

      {success ? (
        <div className="flex flex-col gap-3.5">
          <div className={cn('flex flex-col items-center justify-center text-center', SUCCESS_CONTENT_MIN_H)}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Mail className="h-8 w-8" aria-hidden />
            </div>
            <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-800">
              {forgotPasswordMessages.submittedTitle}
            </h1>
            <p className="mt-2 max-w-[280px] text-center text-[13px] leading-snug font-medium text-slate-500">
              {forgotPasswordMessages.submittedBodyPrefix}{' '}
              <span className="font-semibold text-slate-700">{submittedEmail}</span>,{' '}
              {forgotPasswordMessages.submittedBodySuffix}
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push('/login')}
          >
            {forgotPasswordMessages.backToLoginCta}
          </Button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field
            label={
              <span className="flex w-full justify-between">
                <span>Email</span>
                <Link href="/login" className="text-xs font-semibold text-brand no-underline">
                  Back to login
                </Link>
              </span>
            }
          >
            <TextInput
              ref={emailRef}
              name="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                clearError();
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              type="email"
              disabled={isPending}
              leftIcon={<Mail className="h-4 w-4" />}
              error={Boolean(displayError)}
            />
          </Field>

          <Field label="How it works">
            <div className="flex h-11 items-center">
              <p className="text-[13px] leading-snug font-medium text-slate-500">{forgotPasswordMessages.disclaimer}</p>
            </div>
          </Field>

          <div className="min-h-6 py-0.5" role={displayError ? 'alert' : undefined} aria-live="polite">
            {displayError && (
              <p className="text-[12.5px] leading-snug font-semibold text-danger-press">{displayError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {forgotPasswordMessages.sendResetLink}
          </Button>
        </form>
      )}

      <p className={cn('mt-5.5 text-center text-[13px] font-medium text-slate-500', success && 'invisible')}>
        Need access? Contact your administrator.
      </p>
    </AuthLayout>
  );
}
