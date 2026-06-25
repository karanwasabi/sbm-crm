'use server';

import { createEmailTemplate, sendEmailTemplateTest, updateEmailTemplate, type EmailTemplate } from '@/utils/api';
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

export async function sendEmailTemplateTestAction(templateId: string, toEmail: string): Promise<void> {
  await sendEmailTemplateTest(templateId, toEmail);
}
