'use server';

import { createEmailTemplate, sendEmailTemplateTest, updateEmailTemplate, type EmailTemplate } from '@/utils/api';
import type { EmailBlock, EmailTemplateClassification, EmailTemplateLayout } from '@/lib/email-template-types';

export type SaveEmailTemplateInput = {
  name: string;
  classification: EmailTemplateClassification;
  layout: EmailTemplateLayout;
  subject: string;
  contentJson: EmailBlock[];
  htmlCompiled: string;
  textCompiled: string;
  status: 'draft' | 'active' | 'archived';
};

export async function saveEmailTemplateAction(
  templateId: string | null,
  input: SaveEmailTemplateInput
): Promise<EmailTemplate> {
  if (templateId) {
    return updateEmailTemplate(templateId, input);
  }
  return createEmailTemplate(input);
}

export async function sendEmailTemplateTestAction(templateId: string, toEmail: string): Promise<void> {
  await sendEmailTemplateTest(templateId, toEmail);
}
