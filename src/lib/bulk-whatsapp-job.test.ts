import { describe, expect, it } from 'vitest';
import { readBulkWhatsAppJobId } from '@/lib/bulk-whatsapp-job';

const JOB_ID = '6f1c2a40-7b3e-4d2a-9c11-0a1b2c3d4e5f';

describe('readBulkWhatsAppJobId', () => {
  it('reads the job document id returned by the WhatsApp start endpoint', () => {
    expect(readBulkWhatsAppJobId({ id: JOB_ID })).toBe(JOB_ID);
  });

  it('reads job_id when that is the only identifier', () => {
    expect(readBulkWhatsAppJobId({ job_id: JOB_ID })).toBe(JOB_ID);
  });

  it('prefers id over job_id', () => {
    expect(readBulkWhatsAppJobId({ id: JOB_ID, job_id: 'not-used' })).toBe(JOB_ID);
  });

  it('rejects a missing id so the client never requests /bulk-whatsapp/undefined', () => {
    expect(readBulkWhatsAppJobId({})).toBeNull();
    expect(readBulkWhatsAppJobId({ id: 'undefined' })).toBeNull();
    expect(readBulkWhatsAppJobId({ job_id: '' })).toBeNull();
    expect(readBulkWhatsAppJobId(null)).toBeNull();
  });
});
