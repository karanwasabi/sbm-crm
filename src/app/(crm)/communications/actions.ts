'use server';

import {
  createEmailTemplate,
  updateEmailTemplate,
  createAutomation,
  updateAutomation,
  activateAutomation,
  deactivateAutomation,
  deleteAutomation,
  testAutomation,
  validateAutomation,
  listAutomationEnrollments,
  getAutomationEnrollmentLog,
  type EmailTemplate,
  type Automation,
  type AutomationTestRunResult,
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

export async function testAutomationAction(automationId: string, leadId: string): Promise<AutomationTestRunResult> {
  return testAutomation(automationId, leadId);
}

export async function listAutomationEnrollmentsAction(
  automationId: string,
  testMode?: boolean
): Promise<AutomationEnrollment[]> {
  return listAutomationEnrollments(automationId, { testMode });
}

export async function getAutomationEnrollmentLogAction(enrollmentId: string): Promise<AutomationRunLogEntry[]> {
  return getAutomationEnrollmentLog(enrollmentId);
}

export async function deleteAutomationAction(automationId: string): Promise<void> {
  await deleteAutomation(automationId);
}
