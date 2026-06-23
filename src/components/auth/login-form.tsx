'use client';

import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  login,
  resendLoginOtp,
  sendLoginOtp,
  verifyLoginOtp,
  type LoginFocusField,
  type LoginState,
  type SendLoginOtpState,
} from '@/app/(auth)/login/actions';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { EMAIL_OTP_MAX_LENGTH, isValidEmailOtp, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/email-otp';

const initialState: LoginState = { error: null };
const initialSendOtpState: SendLoginOtpState = { error: null, sent: false, email: null };

const linkButtonClass =
  'cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-brand no-underline hover:underline disabled:cursor-not-allowed disabled:opacity-60';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [sendOtpState, sendOtpAction, sendOtpPending] = useActionState(sendLoginOtp, initialSendOtpState);
  const [verifyOtpState, verifyOtpAction, verifyOtpPending] = useActionState(verifyLoginOtp, initialState);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [displayErrorFields, setDisplayErrorFields] = useState<LoginFocusField[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const sendOtpWasPending = useRef(false);
  const verifyOtpWasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      setDisplayError(state.error);
      setDisplayErrorFields(state.errorFields ?? []);
      if (state.error) {
        if (state.focusField === 'email') {
          emailRef.current?.focus();
        } else {
          passwordRef.current?.focus();
        }
      }
    }
    wasPending.current = isPending;
  }, [isPending, state.error, state.focusField, state.errorFields]);

  useEffect(() => {
    if (sendOtpWasPending.current && !sendOtpPending) {
      setDisplayError(sendOtpState.error);
      setDisplayErrorFields(sendOtpState.error ? ['email'] : []);
      if (sendOtpState.error) {
        emailRef.current?.focus();
      }
    }
    sendOtpWasPending.current = sendOtpPending;
  }, [sendOtpPending, sendOtpState.error]);

  useEffect(() => {
    if (!sendOtpState.sent || !sendOtpState.email) return;
    setOtpSent(true);
    setEmail(sendOtpState.email);
    setDisplayError(null);
    setDisplayErrorFields([]);
    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  }, [sendOtpState.sent, sendOtpState.email]);

  useEffect(() => {
    if (!otpSent) return;
    otpRef.current?.focus();
  }, [otpSent]);

  useEffect(() => {
    if (verifyOtpWasPending.current && !verifyOtpPending) {
      setDisplayError(verifyOtpState.error);
      setDisplayErrorFields(verifyOtpState.errorFields ?? []);
      if (verifyOtpState.error) {
        otpRef.current?.focus();
      }
    }
    verifyOtpWasPending.current = verifyOtpPending;
  }, [verifyOtpPending, verifyOtpState.error, verifyOtpState.errorFields]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const clearError = () => {
    if (displayError) setDisplayError(null);
    if (displayErrorFields.length > 0) setDisplayErrorFields([]);
  };

  const cancelOtpSignIn = () => {
    setOtpSent(false);
    setOtp('');
    setResendCooldown(0);
    clearError();
    passwordRef.current?.focus();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const result = await resendLoginOtp(email);
    if (result.error) {
      setDisplayError(result.error);
      setDisplayErrorFields(['email']);
      return;
    }
    setDisplayError(null);
    setDisplayErrorFields([]);
    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    otpRef.current?.focus();
  };

  const error = displayError;
  const emailHasError = displayErrorFields.includes('email');
  const passwordHasError = displayErrorFields.includes('password');
  const otpHasError = displayErrorFields.includes('otp');
  const formBusy = isPending || sendOtpPending || verifyOtpPending;

  const resendControl =
    resendCooldown > 0 ? (
      <span className="shrink-0 text-xs font-semibold text-slate-400">Resend in {resendCooldown}s</span>
    ) : (
      <button type="button" className={linkButtonClass} onClick={() => void handleResend()}>
        Resend OTP
      </button>
    );

  return (
    <AuthLayout>
      <div className="mb-7">
        <SbmWordmark size="lg" />
      </div>

      <div className="flex flex-col gap-3.5">
        <Field label="Email">
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
            readOnly={otpSent}
            disabled={formBusy}
            leftIcon={<Mail className="h-4 w-4" />}
            error={emailHasError}
            className={otpSent ? 'cursor-default border-slate-100 bg-canvas-cool' : undefined}
          />
        </Field>

        {!otpSent ? (
          <>
            <form action={formAction} className="flex flex-col gap-3.5">
              <input type="hidden" name="email" value={email} />

              <Field
                label={
                  <span className="flex w-full justify-between">
                    <span>Password</span>
                    <Link href="/forgot-password" className="text-xs font-semibold text-brand no-underline">
                      Forgot Password?
                    </Link>
                  </span>
                }
              >
                <TextInput
                  ref={passwordRef}
                  name="password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isPending || sendOtpPending}
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={passwordHasError}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex cursor-pointer border-none bg-transparent p-0"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </Field>

              <div className="min-h-6 py-0.5" role={error ? 'alert' : undefined} aria-live="polite">
                {error && <p className="text-[12.5px] leading-snug font-semibold text-danger-press">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isPending}
                loadingLabel="Logging in…"
                disabled={sendOtpPending}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Login
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form action={sendOtpAction}>
              <input type="hidden" name="email" value={email} />
              <Button
                type="submit"
                variant="light"
                size="lg"
                fullWidth
                loading={sendOtpPending}
                loadingLabel="Sending OTP…"
                disabled={isPending || !email.trim()}
                leftIcon={<Mail className="h-4 w-4" />}
              >
                Login via OTP
              </Button>
            </form>
          </>
        ) : (
          <form action={verifyOtpAction} className="flex flex-col gap-3.5">
            <input type="hidden" name="email" value={email} />

            <Field
              label={
                <span className="flex w-full items-center justify-between gap-3">
                  <span>OTP</span>
                  {resendControl}
                </span>
              }
              error={error && otpHasError ? error : undefined}
            >
              <TextInput
                ref={otpRef}
                name="otp"
                value={otp}
                onChange={(value) => {
                  setOtp(value.replace(/\D/g, '').slice(0, EMAIL_OTP_MAX_LENGTH));
                  clearError();
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={verifyOtpPending}
                error={otpHasError}
                placeholder="Enter code from email"
              />
            </Field>

            <div className="min-h-6 py-0.5" role={error && !otpHasError ? 'alert' : undefined} aria-live="polite">
              {error && !otpHasError ? (
                <p className="text-[12.5px] leading-snug font-semibold text-danger-press">{error}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={verifyOtpPending}
              loadingLabel="Logging in…"
              disabled={!isValidEmailOtp(otp)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Login
            </Button>

            <p className="text-center">
              <button type="button" className={linkButtonClass} onClick={cancelOtpSignIn}>
                Use password instead
              </button>
            </p>
          </form>
        )}
      </div>

      <p className="mt-5.5 text-center text-[13px] font-medium text-slate-500">
        Need access? Contact your administrator.
      </p>
    </AuthLayout>
  );
}
