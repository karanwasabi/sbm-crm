const SKIP_REASON_LABELS: Record<string, string> = {
  no_phone: 'This lead has no phone number.',
  invalid_phone: 'This lead has an invalid phone number.',
  opted_out: 'This lead has opted out of WhatsApp.',
  notify_whatsapp_disabled: 'This member has WhatsApp notifications disabled in the app.',
  no_consent: 'This lead has not given marketing consent (DPDP).',
  template_not_active: 'The selected template is not active.',
  whatsapp_not_configured: 'WhatsApp is not configured on the backend (Convonite API key / channel ID).',
  missing_param: 'A required template variable is missing for this recipient.',
};

export function formatWhatsAppSendError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'Failed to send WhatsApp.';
  }

  if (trimmed === 'whatsapp sends are not enabled') {
    return 'WhatsApp sends are disabled on the backend. Set WHATSAPP_SENDS_ENABLED=true.';
  }

  if (trimmed === 'whatsapp_not_configured') {
    return SKIP_REASON_LABELS.whatsapp_not_configured;
  }

  if (trimmed.startsWith('send skipped: ')) {
    const reason = trimmed.slice('send skipped: '.length);
    return SKIP_REASON_LABELS[reason] ?? `Send was skipped: ${reason.replaceAll('_', ' ')}`;
  }

  if (trimmed === 'recipient phone is required') {
    return 'This lead has no phone number. Add WhatsApp in the member app — it will sync to the lead automatically.';
  }

  return trimmed;
}
