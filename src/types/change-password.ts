export type ChangePasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export type ChangePasswordState = {
  error: string | null;
  success: boolean;
  focusField?: ChangePasswordField;
  errorFields?: ChangePasswordField[];
};
