'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { resetPasswordMessages } from '@/lib/forgot-password-messages';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-requirements';
import { createClient } from '@/utils/supabase/client';

type ResetPasswordField = 'password' | 'confirmPassword';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<ResetPasswordField[]>([]);
  const [success, setSuccess] = useState(false);
  const [isInviteFlow, setIsInviteFlow] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const establishRecoverySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && (type === 'invite' || type === 'recovery')) {
        setIsInviteFlow(type === 'invite');
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === 'invite' ? 'invite' : 'recovery',
        });

        if (verifyError) {
          setError(resetPasswordMessages.invalidLink);
          setIsCheckingSession(false);
          return;
        }

        window.history.replaceState(null, '', window.location.pathname);
        setIsReady(true);
        setIsCheckingSession(false);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(resetPasswordMessages.invalidLink);
          setIsCheckingSession(false);
          return;
        }

        if (type === 'invite') {
          setIsInviteFlow(true);
        }

        window.history.replaceState(null, '', window.location.pathname);
        setIsReady(true);
        setIsCheckingSession(false);
        return;
      }

      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(resetPasswordMessages.invalidLink);
          setIsCheckingSession(false);
          return;
        }

        window.history.replaceState(null, '', window.location.pathname);
        setIsReady(true);
        setIsCheckingSession(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsReady(true);
        setIsCheckingSession(false);
        return;
      }

      setError(resetPasswordMessages.invalidLink);
      setIsCheckingSession(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
        setIsCheckingSession(false);
        setError(null);
      }
    });

    void establishRecoverySession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => {
    if (error) setError(null);
    if (errorFields.length > 0) setErrorFields([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    const nextErrorFields: ResetPasswordField[] = [];

    if (!password) nextErrorFields.push('password');
    if (!confirmPassword) nextErrorFields.push('confirmPassword');

    if (nextErrorFields.length > 0) {
      setError(
        nextErrorFields.includes('password') && !password
          ? resetPasswordMessages.passwordRequired
          : resetPasswordMessages.confirmRequired
      );
      setErrorFields(nextErrorFields);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(resetPasswordMessages.passwordTooShort);
      setErrorFields(['password']);
      return;
    }

    if (password !== confirmPassword) {
      setError(resetPasswordMessages.passwordMismatch);
      setErrorFields(['confirmPassword']);
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (updateError) {
      setError(resetPasswordMessages.updateFailed);
      setErrorFields(['password', 'confirmPassword']);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);

    window.setTimeout(() => {
      router.replace('/login');
    }, 2200);
  };

  if (isCheckingSession) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
          <p className="mt-4 text-sm font-medium text-slate-500">Verifying reset link…</p>
        </div>
      </AuthLayout>
    );
  }

  if (!isReady && error) {
    return (
      <AuthLayout>
        <div className="mb-7">
          <SbmWordmark size="lg" />
        </div>
        <p className="text-[13px] leading-snug font-semibold text-danger-press" role="alert">
          {error}
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex text-xs font-semibold text-brand no-underline transition-colors hover:text-brand-deep"
        >
          {resetPasswordMessages.requestNewLink}
        </Link>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="mb-7">
            <SbmWordmark size="lg" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">{resetPasswordMessages.successTitle}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">{resetPasswordMessages.successBody}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <SbmWordmark size="lg" />
      </div>

      <h1 className="text-lg font-bold tracking-tight text-slate-800">
        {isInviteFlow ? resetPasswordMessages.inviteTitle : resetPasswordMessages.title}
      </h1>
      <p className="mt-1.5 mb-5 text-[13px] leading-snug font-medium text-slate-500">
        {isInviteFlow ? resetPasswordMessages.inviteSubtitle : resetPasswordMessages.subtitle}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Field label="New password">
          <TextInput
            name="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              clearError();
            }}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            autoFocus
            disabled={isSubmitting}
            leftIcon={<Lock className="h-4 w-4" />}
            error={errorFields.includes('password')}
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

        <Field label="Confirm password">
          <TextInput
            name="confirmPassword"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              clearError();
            }}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isSubmitting}
            leftIcon={<Lock className="h-4 w-4" />}
            error={errorFields.includes('confirmPassword')}
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="flex cursor-pointer border-none bg-transparent p-0"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          loading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {resetPasswordMessages.updatePassword}
        </Button>
      </form>
    </AuthLayout>
  );
}
