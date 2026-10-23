import type { ProgramHistoryItem } from '@/types/crm';

export type AutoRenewInfo = {
  label: string;
  tone: 'success' | 'warn' | 'danger' | 'neutral';
};

export function autoRenewInfo(item: ProgramHistoryItem): AutoRenewInfo | null {
  const status = item.status.trim().toLowerCase();
  if (status === 'payment pending' || status === 'cancelled') return null;

  if (item.cancelAtPeriodEnd === true) {
    return { label: 'Cancelling', tone: 'warn' };
  }

  const sub = (item.subscriptionStatus ?? '').trim().toLowerCase();
  if (sub === 'paused') {
    return { label: 'Paused', tone: 'warn' };
  }
  if (sub === 'cancelled' || sub === 'halted' || sub === 'expired' || sub === 'completed') {
    return { label: 'Off', tone: 'danger' };
  }

  if (!item.autoRenewEnabled) {
    return null;
  }

  return { label: 'On', tone: 'success' };
}
