const FRIENDLY_ERROR_MESSAGES: Array<{ match: (message: string) => boolean; text: string }> = [
  {
    match: (message) => /token has expired or is invalid/i.test(message),
    text: "That code isn't valid anymore. Request a new one and try again.",
  },
  {
    match: (message) => /otp has expired|expired otp/i.test(message),
    text: 'That code has expired. Request a new one and try again.',
  },
  {
    match: (message) => /invalid otp|otp is invalid/i.test(message),
    text: "That code doesn't match. Check your email and try again.",
  },
  {
    match: (message) => /email link is invalid or has expired/i.test(message),
    text: "That link isn't valid anymore. Request a new verification code.",
  },
];

export function formatUserFacingError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  for (const { match, text } of FRIENDLY_ERROR_MESSAGES) {
    if (match(trimmed)) return text;
  }

  return trimmed
    .split(/(?<=\.)\s+/)
    .map((part) => {
      const segment = part.trim();
      if (!segment) return segment;
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(' ');
}
