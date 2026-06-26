'use server';

import {
  createEmailTemplate,
  updateEmailTemplate,
  createAutomation,
  updateAutomation,
  publishAutomation,
  testAutomation,
  type EmailTemplate,
  type Automation,
} from '@/utils/api';
import type { EmailTemplateClassification, GrapesProjectData } from '@/lib/email-template-types';
import type { AutomationGraph, AutomationTriggerType, AutomationStatus } from '@/lib/automation-types';

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

export async function publishAutomationAction(automationId: string): Promise<Automation> {
  return publishAutomation(automationId);
}

export async function testAutomationAction(automationId: string, leadId: string): Promise<void> {
  await testAutomation(automationId, leadId);
}
