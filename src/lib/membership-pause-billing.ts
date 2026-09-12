/** CRM-side eligibility for pausing while auto-renew stays on (mirrors backend Path A/B). */

export function paymentMethodLooksLikeUPI(summary?: string | null): boolean {
  return (summary ?? '').toLowerCase().includes('upi');
}

export function paymentMethodLooksLikeCard(summary?: string | null): boolean {
  const s = (summary ?? '').toLowerCase();
  if (paymentMethodLooksLikeUPI(summary) || s.includes('emandate') || s.includes('nach')) {
    return false;
  }
  return ['card', 'visa', 'master', 'rupay', 'amex', 'maestro', 'diners'].some((token) => s.includes(token));
}

export function canDeferAutoRenewForPause(input: {
  autoRenewEnabled?: boolean | null;
  cancelAtPeriodEnd?: boolean | null;
  subscriptionStatus?: string | null;
  paymentMethodSummary?: string | null;
}): boolean {
  if (!input.autoRenewEnabled || input.cancelAtPeriodEnd) {
    return true;
  }
  const status = (input.subscriptionStatus ?? '').trim().toLowerCase();
  if (status === 'active' || status === 'paused') {
    return true;
  }
  if (status === 'authenticated') {
    return paymentMethodLooksLikeCard(input.paymentMethodSummary);
  }
  return false;
}
