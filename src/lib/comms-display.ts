type SendStatusTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger';

export function emailSendStatusLabel(status: string): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'queued':
      return 'Queued';
    default:
      return status;
  }
}

export function emailSendStatusTone(status: string): SendStatusTone {
  switch (status) {
    case 'sent':
      return 'success';
    case 'failed':
      return 'danger';
    case 'skipped':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function formatCommsWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}
