'use server';

import {
  createEmailTemplate,
  updateEmailTemplate,
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
  ApiError,
  type EmailTemplate,
  type Automation,
  type BulkLeadEmailSendJob,
  type BulkLeadEmailSendList,
} from '@/utils/api';
import type {
  AutomationGraph,
  AutomationTriggerType,
  AutomationStatus,
  AutomationEnrollment,
  AutomationRunLogEntry,
} from '@/lib/automation-types';
import type { EmailTemplateClassification, GrapesProjectData } from '@/lib/email-template-types';

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

export type SaveAutomationInput = {
  name: string;
  description: string;
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
