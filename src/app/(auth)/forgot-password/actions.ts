'use server';

import { headers } from 'next/headers';
import { isValidEmailFormat } from '@/lib/email-validation';
import { forgotPasswordMessages } from '@/lib/forgot-password-messages';
import { createClient } from '@/utils/supabase/server';

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
  email?: string;
};

function getResetRedirectUrl(headerStore: Headers): string {
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';

  if (host) {
    return `${proto}://${host}/reset-password`;
  }

  return 'http://localhost:3000/reset-password';
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { error: forgotPasswordMessages.emailRequired, success: false };
  }

  if (!isValidEmailFormat(email)) {
    return { error: forgotPasswordMessages.emailInvalid, success: false };
  }

  const headerStore = await headers();
  const redirectTo = getResetRedirectUrl(headerStore);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { error: forgotPasswordMessages.requestFailed, success: false };
  }

  return { error: null, success: true, email };
}
