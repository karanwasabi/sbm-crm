'use server';

import { MIN_PASSWORD_LENGTH } from '@/lib/password-requirements';
import type { ChangePasswordField, ChangePasswordState } from '@/types/change-password';
import { createClient } from '@/utils/supabase/server';

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  const errorFields: ChangePasswordField[] = [];

  if (!currentPassword) errorFields.push('currentPassword');
  if (!newPassword) errorFields.push('newPassword');
  if (!confirmPassword) errorFields.push('confirmPassword');

  if (errorFields.length > 0) {
    return {
      error: 'All fields are required.',
      success: false,
      focusField: errorFields[0],
      errorFields,
    };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      success: false,
      focusField: 'newPassword',
      errorFields: ['newPassword'],
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: 'New passwords do not match.',
      success: false,
      focusField: 'confirmPassword',
      errorFields: ['confirmPassword'],
    };
  }

  if (newPassword === currentPassword) {
    return {
      error: 'New password must be different from your current password.',
      success: false,
      focusField: 'newPassword',
      errorFields: ['newPassword'],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: 'You must be signed in to change your password.', success: false };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      error: 'Current password is incorrect.',
      success: false,
      focusField: 'currentPassword',
      errorFields: ['currentPassword'],
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return {
      error: updateError.message,
      success: false,
      focusField: 'newPassword',
      errorFields: ['newPassword'],
    };
  }

  return { error: null, success: true };
}
