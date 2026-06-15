import { getOnboardingTimezoneCatalog, resolveOnboardingTimezoneId } from '@/domain/onboarding-timezones';

let cachedAllowedTimezoneIds: Set<string> | null = null;

const TIMEZONE_PERSISTENCE_CANONICAL: Record<string, string> = {
  'Asia/Colombo': 'Asia/Kolkata',
};

function allowedOnboardingTimezoneIds(): Set<string> {
  if (!cachedAllowedTimezoneIds) {
    cachedAllowedTimezoneIds = new Set(getOnboardingTimezoneCatalog().map((e) => e.id));
  }
  return cachedAllowedTimezoneIds;
}

export function normalizeProfileTimezoneForDb(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const resolved = resolveOnboardingTimezoneId(trimmed);
  const persistenceCanonical = TIMEZONE_PERSISTENCE_CANONICAL[resolved] ?? resolved;
  return allowedOnboardingTimezoneIds().has(persistenceCanonical) ? persistenceCanonical : null;
}

export function formatTimezoneLabel(ianaId: string): string {
  const entry = getOnboardingTimezoneCatalog().find((e) => e.id === ianaId);
  if (!entry) return ianaId;
  return `${entry.id} (${entry.offsetStr})`;
}
