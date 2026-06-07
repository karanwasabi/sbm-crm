'use client';

import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { login, type LoginFocusField, type LoginState } from '@/app/(auth)/login/actions';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [displayErrorFields, setDisplayErrorFields] = useState<LoginFocusField[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);

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

  const clearError = () => {
    if (displayError) setDisplayError(null);
    if (displayErrorFields.length > 0) setDisplayErrorFields([]);
  };

  const error = displayError;
  const emailHasError = displayErrorFields.includes('email');
  const passwordHasError = displayErrorFields.includes('password');

  return (
    <AuthLayout>
      <div className="mb-7">
        <SbmWordmark size="lg" />
      </div>

      <form action={formAction} className="flex flex-col gap-3.5">
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
            tabIndex={1}
            type="email"
            disabled={isPending}
            leftIcon={<Mail className="h-4 w-4" />}
            error={emailHasError}
          />
        </Field>

        <Field
          label={
            <span className="flex w-full justify-between">
              <span>Password</span>
              <Link href="/forgot-password" tabIndex={4} className="text-xs font-semibold text-brand no-underline">
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
            tabIndex={2}
            disabled={isPending}
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
          tabIndex={3}
          disabled={isPending}
          rightIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-5.5 text-center text-[13px] font-medium text-slate-500">
        Need access? Contact your administrator.
      </p>
    </AuthLayout>
  );
}
