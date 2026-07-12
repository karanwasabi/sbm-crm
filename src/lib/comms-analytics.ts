import type { CommsAnalyticsTotals } from '@/utils/api';

/** Resend accepted the send (status = sent) vs failed API calls. */
export function sendSuccessRate(totals: CommsAnalyticsTotals): number | null {
  const attempted = totals.sent + totals.failed;
  if (attempted <= 0) return null;
  return (totals.sent / attempted) * 100;
}

/** Delivery rate from synced Resend outcomes (webhooks + background reconcile). */
export function deliveryRate(totals: CommsAnalyticsTotals): number | null {
  if (totals.sent <= 0 || totals.delivered <= 0) return null;
  return (totals.delivered / totals.sent) * 100;
}

/** @deprecated Use deliveryRate — kept for callers expecting the old name. */
export function webhookDeliveryRate(totals: CommsAnalyticsTotals): number | null {
  return deliveryRate(totals);
}

export function formatHeaderDeliveryStat(analytics: { totals: CommsAnalyticsTotals } | null): {
  label: string;
  value: string;
} {
  if (!analytics) {
    return { label: 'Send success', value: '—' };
  }

  const delivery = deliveryRate(analytics.totals);
  if (delivery != null) {
    return { label: 'Delivery rate', value: `${delivery.toFixed(1)}%` };
  }

  const success = sendSuccessRate(analytics.totals);
  if (success == null) {
    return { label: 'Send success', value: '—' };
  }

  return { label: 'Send success', value: `${success.toFixed(1)}%` };
}
