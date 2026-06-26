import type { CommsAnalytics, CommsAnalyticsTotals } from '@/utils/api';

/** Resend accepted the send (status = sent) vs failed API calls. */
export function sendSuccessRate(totals: CommsAnalyticsTotals): number | null {
  const attempted = totals.sent + totals.failed;
  if (attempted <= 0) return null;
  return (totals.sent / attempted) * 100;
}

/** Inbox delivery from Resend webhooks (email.delivered events). */
export function webhookDeliveryRate(totals: CommsAnalyticsTotals): number | null {
  if (totals.sent <= 0 || totals.delivered <= 0) return null;
  return (totals.delivered / totals.sent) * 100;
}

export function formatHeaderDeliveryStat(analytics: CommsAnalytics | null): {
  label: string;
  value: string;
} {
  if (!analytics) {
    return { label: 'Send success', value: '—' };
  }

  const delivery = webhookDeliveryRate(analytics.totals);
  if (delivery != null) {
    return { label: 'Delivery rate', value: `${delivery.toFixed(1)}%` };
  }

  const success = sendSuccessRate(analytics.totals);
  if (success == null) {
    return { label: 'Send success', value: '—' };
  }

  return { label: 'Send success', value: `${success.toFixed(1)}%` };
}
