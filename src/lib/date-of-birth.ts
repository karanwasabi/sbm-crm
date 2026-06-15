export const MIN_AGE_ABSOLUTE = 13;
export const MIN_AGE_WITHOUT_CONSENT = 18;
export const MAX_AGE = 100;

export const PARENTAL_CONSENT_LABEL =
  'I confirm that I am the parent or legal guardian of this member, or that my parent or legal guardian has given their consent for me to join this program and for my personal data to be processed as described in the Privacy Policy.';

function parseLocalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getAgeYears(dateOfBirth: Date, today = new Date()): number {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

export function getDateOfBirthInputBounds(today = new Date()): { min: string; max: string } {
  const oldest = new Date(today);
  oldest.setFullYear(oldest.getFullYear() - MAX_AGE);

  const youngest = new Date(today);
  youngest.setFullYear(youngest.getFullYear() - MIN_AGE_ABSOLUTE);

  return {
    min: toDateInputValue(oldest),
    max: toDateInputValue(youngest),
  };
}

export function requiresParentalConsent(age: number): boolean {
  return age >= MIN_AGE_ABSOLUTE && age < MIN_AGE_WITHOUT_CONSENT;
}

export function validateDateOfBirth(dateOfBirth: string, parentalConsent: boolean): string | null {
  if (!dateOfBirth.trim()) return null;

  const parsed = parseLocalDate(dateOfBirth);
  if (!parsed) return 'Enter a valid date of birth.';

  const age = getAgeYears(parsed);
  if (age < MIN_AGE_ABSOLUTE) {
    return 'You must be at least 13 years old.';
  }
  if (age > MAX_AGE) {
    return 'Date of birth cannot be more than 100 years ago.';
  }
  if (requiresParentalConsent(age) && !parentalConsent) {
    return 'Parental consent is required for members under 18.';
  }

  return null;
}

export function isParentalConsentValidationError(message: string | null | undefined): boolean {
  return message === 'Parental consent is required for members under 18.';
}

export function shouldShowParentalConsent(dateOfBirth: string): boolean {
  if (!dateOfBirth.trim()) return false;
  const parsed = parseLocalDate(dateOfBirth);
  if (!parsed) return false;
  const age = getAgeYears(parsed);
  return requiresParentalConsent(age);
}
