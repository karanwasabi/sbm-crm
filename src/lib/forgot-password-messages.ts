export const forgotPasswordMessages = {
  disclaimer: 'Enter your email and we will send you a reset link.',
  emailRequired: 'Please enter your email.',
  emailInvalid: "That doesn't look like a valid email.",
  submittedTitle: 'Check your email',
  submittedBodyPrefix: 'If an account exists for',
  submittedBodySuffix: 'you will receive a password reset link shortly.',
  backToLoginCta: 'Back to login',
  sendResetLink: 'Send reset link',
  requestFailed: "Couldn't send reset link — try again.",
} as const;

export const resetPasswordMessages = {
  title: 'Choose a new password',
  inviteTitle: 'Set your password',
  subtitle: 'Enter a new password for your account.',
  inviteSubtitle: 'Create a password to join the team and access the CRM.',
  passwordRequired: 'Please enter a new password.',
  passwordTooShort: 'Use at least 8 characters.',
  confirmRequired: 'Please confirm your password.',
  passwordMismatch: 'Passwords do not match.',
  invalidLink: 'This reset link is invalid or expired. Request a new one.',
  updateFailed: "Couldn't update password — try again.",
  successTitle: 'Password updated',
  successBody: 'You can log in with your new password.',
  updatePassword: 'Update password',
  requestNewLink: 'Request a new reset link',
} as const;
