'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export type LoginFocusField = 'email' | 'password';

export type LoginState = {
  error: string | null;
  focusField?: LoginFocusField;
  errorFields?: LoginFocusField[];
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email && !password) {
    return {
      error: 'Email and password are required.',
      focusField: 'email',
      errorFields: ['email', 'password'],
    };
  }

  if (!email) {
    return { error: 'Email is required.', focusField: 'email', errorFields: ['email'] };
  }

  if (!password) {
    return { error: 'Password is required.', focusField: 'password', errorFields: ['password'] };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, focusField: 'password', errorFields: ['email', 'password'] };
  }

  redirect('/');
}
