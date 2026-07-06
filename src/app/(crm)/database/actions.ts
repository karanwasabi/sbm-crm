'use server';

import {
  ApiError,
  getBulkLeadEmailSendJob,
  previewBulkLeadEmailSend,
  startBulkLeadEmailSend,
  type BulkLeadEmailPreview,
  type BulkLeadEmailSendJob,
} from '@/utils/api';

export async function previewBulkLeadEmailSendAction(
  templateId: string,
  leadIds: string[]
): Promise<{ preview: BulkLeadEmailPreview | null; error: string | null }> {
  try {
    const preview = await previewBulkLeadEmailSend(templateId, leadIds);
    return { preview, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to preview bulk send.';
    return { preview: null, error: message };
  }
}

export async function startBulkLeadEmailSendAction(
  templateId: string,
  leadIds: string[],
  options?: { skipAlreadySent?: boolean }
): Promise<{ job: BulkLeadEmailSendJob | null; error: string | null }> {
  try {
    const started = await startBulkLeadEmailSend(templateId, leadIds, options);
    const job = await getBulkLeadEmailSendJob(started.job_id);
    return { job, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to start bulk send.';
    return { job: null, error: message };
  }
}

export async function getBulkLeadEmailSendJobAction(
  jobId: string
): Promise<{ job: BulkLeadEmailSendJob | null; error: string | null }> {
  try {
    const job = await getBulkLeadEmailSendJob(jobId);
    return { job, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load bulk send progress.';
    return { job: null, error: message };
  }
}
