const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BulkWhatsAppJobIdentity = {
  id?: string | null;
  job_id?: string | null;
};

/** The start endpoint returns the job as `id`. Older callers also accept `job_id`. */
export function readBulkWhatsAppJobId(payload: BulkWhatsAppJobIdentity | null | undefined): string | null {
  const id = String(payload?.id || payload?.job_id || '').trim();
  return JOB_ID_PATTERN.test(id) ? id : null;
}
