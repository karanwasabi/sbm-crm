'use server';

import {
  createEmailTemplate,
  updateEmailTemplate,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  submitWhatsAppTemplate,
  activateWhatsAppTemplate,
  deactivateWhatsAppTemplate,
  sendWhatsAppTemplateTest,
  syncWhatsAppTemplates,
  createAutomation,
  updateAutomation,
  activateAutomation,
  deactivateAutomation,
  archiveAutomation,
  deleteAutomation,
  validateAutomation,
  listAutomationEnrollments,
  getAutomationEnrollmentLog,
  getBulkLeadEmailSendJob,
  listBulkLeadEmailSendJobs,
  listBulkLeadEmailSendJobSends,
  retryBulkLeadEmailSendFailures,
  getBulkLeadWhatsAppSendJob,
  listBulkLeadWhatsAppSendJobs,
  listBulkLeadWhatsAppSendJobSends,
  listWhatsAppSends,
  ApiError,
  type EmailTemplate,
  type WhatsAppTemplate,
  type Automation,
  type BulkLeadEmailSendJob,
  type BulkLeadEmailSendList,
  type BulkLeadWhatsAppSendJob,
  type BulkLeadWhatsAppSendList,
  type WhatsAppSend,
} from '@/utils/api';
import type {
  AutomationGraph,
  AutomationTriggerType,
  AutomationStatus,
  AutomationChannel,
  AutomationEnrollment,
  AutomationRunLogEntry,
} from '@/lib/automation-types';
import type { EmailTemplateClassification, GrapesProjectData } from '@/lib/email-template-types';
import type { WhatsAppTemplateCategory, WhatsAppTemplatePurpose } from '@/lib/whatsapp-template-types';

export type SaveEmailTemplateInput = {
  name: string;
  classification: EmailTemplateClassification;
  subject: string;
  fromName?: string | null;
  fromLocalPart?: string | null;
  contentJson: GrapesProjectData;
  htmlCompiled: string;
  textCompiled: string;
  status: 'draft' | 'active' | 'archived';
};

export async function saveEmailTemplateAction(
  templateId: string | null,
  input: SaveEmailTemplateInput
): Promise<EmailTemplate> {
  const payload = {
    ...input,
    layout: 'simple' as const,
  };

  if (templateId) {
    return updateEmailTemplate(templateId, payload);
  }
  return createEmailTemplate(payload);
}

export type SaveWhatsAppTemplateInput = {
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  purpose: WhatsAppTemplatePurpose;
  runtimeParams: unknown;
  content: unknown;
};

export async function saveWhatsAppTemplateAction(
  templateId: string | null,
  input: SaveWhatsAppTemplateInput
): Promise<WhatsAppTemplate> {
  if (templateId) {
    return updateWhatsAppTemplate(templateId, input);
  }
  return createWhatsAppTemplate(input);
}

export async function submitWhatsAppTemplateAction(
  templateId: string
): Promise<{ template: WhatsAppTemplate | null; error: string | null }> {
  try {
    const template = await submitWhatsAppTemplate(templateId);
    return { template, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to submit template.';
    return { template: null, error: message };
  }
}

export async function activateWhatsAppTemplateAction(templateId: string): Promise<WhatsAppTemplate> {
  return activateWhatsAppTemplate(templateId);
}

export async function deactivateWhatsAppTemplateAction(templateId: string): Promise<WhatsAppTemplate> {
  return deactivateWhatsAppTemplate(templateId);
}

export async function sendWhatsAppTemplateTestAction(
  templateId: string,
  toPhone: string
): Promise<{ error: string | null }> {
  try {
    await sendWhatsAppTemplateTest(templateId, toPhone);
    return { error: null };
  } catch (error) {
    const { formatWhatsAppSendError } = await import('@/lib/whatsapp-send-errors');
    const message = error instanceof ApiError ? error.message : 'Failed to send test WhatsApp.';
    return { error: formatWhatsAppSendError(message) };
  }
}

export async function syncWhatsAppTemplatesAction(): Promise<{ synced: number }> {
  return syncWhatsAppTemplates();
}

export type SaveAutomationInput = {
  name: string;
  description: string;
  channel?: AutomationChannel;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  graphJson: AutomationGraph;
  status: AutomationStatus;
};

export async function saveAutomationAction(
  automationId: string | null,
  input: SaveAutomationInput
): Promise<Automation> {
  const payload = {
    name: input.name,
    description: input.description,
    channel: input.channel ?? 'email',
    triggerType: input.triggerType,
    triggerConfig: input.triggerConfig,
    graphJson: input.graphJson,
    status: input.status,
  };

  if (automationId) {
    return updateAutomation(automationId, payload);
  }
  return createAutomation(payload);
}

export async function activateAutomationAction(automationId: string): Promise<Automation> {
  return activateAutomation(automationId);
}

export async function validateAutomationAction(automationId: string) {
  return validateAutomation(automationId);
}

export async function deactivateAutomationAction(automationId: string): Promise<Automation> {
  return deactivateAutomation(automationId);
}

export async function archiveAutomationAction(automationId: string): Promise<Automation> {
  return archiveAutomation(automationId);
}

export async function listAutomationEnrollmentsAction(automationId: string): Promise<AutomationEnrollment[]> {
  return listAutomationEnrollments(automationId);
}

export async function getAutomationEnrollmentLogAction(enrollmentId: string): Promise<AutomationRunLogEntry[]> {
  return getAutomationEnrollmentLog(enrollmentId);
}

export async function deleteAutomationAction(automationId: string): Promise<void> {
  await deleteAutomation(automationId);
}

export async function listBulkLeadEmailSendJobsAction(): Promise<BulkLeadEmailSendJob[]> {
  return listBulkLeadEmailSendJobs();
}

export async function getBulkLeadEmailSendJobAction(
  jobId: string
): Promise<{ job: BulkLeadEmailSendJob | null; error: string | null }> {
  try {
    const job = await getBulkLeadEmailSendJob(jobId);
    return { job, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load bulk send job.';
    return { job: null, error: message };
  }
}

export async function listBulkLeadEmailSendJobSendsAction(
  jobId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: BulkLeadEmailSendList | null; error: string | null }> {
  try {
    const data = await listBulkLeadEmailSendJobSends(jobId, options);
    return { data, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load bulk send recipients.';
    return { data: null, error: message };
  }
}

export async function retryBulkLeadEmailSendFailuresAction(
  jobId: string
): Promise<{ requeued: number; error: string | null }> {
  try {
    const result = await retryBulkLeadEmailSendFailures(jobId);
    return { requeued: result.requeued_failures, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to retry bulk send failures.';
    return { requeued: 0, error: message };
  }
}

export async function getBulkLeadWhatsAppSendJobAction(
  jobId: string
): Promise<{ job: BulkLeadWhatsAppSendJob | null; error: string | null }> {
  try {
    const job = await getBulkLeadWhatsAppSendJob(jobId);
    return { job, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load bulk WhatsApp send job.';
    return { job: null, error: message };
  }
}

export async function listBulkLeadWhatsAppSendJobSendsAction(
  jobId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: BulkLeadWhatsAppSendList | null; error: string | null }> {
  try {
    const data = await listBulkLeadWhatsAppSendJobSends(jobId, options);
    return { data, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load bulk WhatsApp send recipients.';
    return { data: null, error: message };
  }
}

export async function listWhatsAppSendsAction(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ sends: WhatsAppSend[]; error: string | null }> {
  try {
    const sends = await listWhatsAppSends(options);
    return { sends, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load WhatsApp sends.';
    return { sends: [], error: message };
  }
}
