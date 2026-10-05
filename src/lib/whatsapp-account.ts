import type { WhatsAppAccount } from '@/utils/api';

export const WA_ACCOUNT_SEARCH_PARAM = 'wa_account';

export function whatsAppAccountLabel(account: WhatsAppAccount): string {
  const phone = account.phoneE164?.trim();
  if (phone) {
    return `${account.displayName} · ${phone}`;
  }
  return account.displayName;
}

export function resolveWhatsAppAccountId(
  requestedId: string | undefined,
  accounts: WhatsAppAccount[],
  defaultAccountId: string
): string {
  const active = accounts.filter((account) => account.active);
  const pool = active.length > 0 ? active : accounts;
  if (requestedId && pool.some((account) => account.id === requestedId)) {
    return requestedId;
  }
  if (defaultAccountId && pool.some((account) => account.id === defaultAccountId)) {
    return defaultAccountId;
  }
  const defaultRow = pool.find((account) => account.isDefault);
  return defaultRow?.id ?? pool[0]?.id ?? '';
}
