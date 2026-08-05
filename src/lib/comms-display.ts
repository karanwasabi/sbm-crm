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

type BulkJobStatusTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger';

export function bulkJobStatusLabel(status: string): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function bulkJobStatusTone(status: string): BulkJobStatusTone {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'brand';
    case 'failed':
      return 'danger';
    case 'queued':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function whatsAppSendStatusLabel(status: string): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    case 'failed':
    case 'error':
      return 'Failed';
    case 'rejected':
      return 'Rejected';
    case 'skipped':
      return 'Skipped';
    case 'queued':
      return 'Queued';
    default:
      return status;
  }
}

export function whatsAppSendStatusTone(status: string): SendStatusTone {
  switch (status) {
    case 'delivered':
    case 'read':
      return 'success';
    case 'sent':
      return 'brand';
    case 'failed':
    case 'error':
    case 'rejected':
      return 'danger';
    case 'skipped':
      return 'warn';
    default:
      return 'neutral';
  }
}
