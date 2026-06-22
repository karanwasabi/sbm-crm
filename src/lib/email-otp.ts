export const EMAIL_OTP_MIN_LENGTH = 6;
export const EMAIL_OTP_MAX_LENGTH = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function isValidEmailOtp(value: string): boolean {
  return new RegExp(`^\\d{${EMAIL_OTP_MIN_LENGTH},${EMAIL_OTP_MAX_LENGTH}}$`).test(value.trim());
}

export function emailOtpInvalidMessage(): string {
  return 'Enter the OTP from your email.';
}
