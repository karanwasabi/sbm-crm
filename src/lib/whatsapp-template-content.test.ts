import { describe, expect, it } from 'vitest';

import {
  emptyWhatsAppTemplateFormContent,
  finalizeWhatsAppTemplateName,
  normalizeWhatsAppTemplateName,
  validateWhatsAppTemplate,
  validateWhatsAppTemplateForm,
  validateWhatsAppTemplateName,
} from '@/lib/whatsapp-template-content';

describe('normalizeWhatsAppTemplateName', () => {
  it('lowercases and strips invalid characters while typing', () => {
    expect(normalizeWhatsAppTemplateName('RESET_3Days_missed')).toBe('reset_3days_missed');
    expect(normalizeWhatsAppTemplateName('Reset 3 Days!')).toBe('reset_3_days');
    expect(normalizeWhatsAppTemplateName('foo--bar')).toBe('foo_bar');
    expect(normalizeWhatsAppTemplateName('_leading')).toBe('leading');
  });

  it('keeps a trailing underscore while typing', () => {
    expect(normalizeWhatsAppTemplateName('reset_')).toBe('reset_');
    expect(finalizeWhatsAppTemplateName('reset_')).toBe('reset');
  });
});

describe('validateWhatsAppTemplateName', () => {
  it('accepts valid names', () => {
    expect(validateWhatsAppTemplateName('reset_3days_missed')).toBeNull();
  });

  it('rejects empty after normalization', () => {
    expect(validateWhatsAppTemplateName('!!!')).toMatch(/required/i);
  });
});

describe('validateWhatsAppTemplateForm', () => {
  function formWithBody(body: string) {
    const form = emptyWhatsAppTemplateFormContent();
    form.body = body;
    form.variables = body.includes('{{name}}') ? [{ name: 'name', example: 'Alex', leadField: 'name' }] : [];
    return form;
  }

  it('rejects body starting or ending with a variable', () => {
    expect(validateWhatsAppTemplateForm(formWithBody('{{name}} hello there'))).toMatch(/start/i);
    expect(validateWhatsAppTemplateForm(formWithBody('Hello {{name}}'))).toMatch(/end/i);
  });

  it('rejects adjacent variables and excess whitespace', () => {
    expect(validateWhatsAppTemplateForm(formWithBody('Hi {{name}}{{city}} today'))).toMatch(/adjacent/i);
    expect(validateWhatsAppTemplateForm(formWithBody('Hi    there friends'))).toMatch(/spaces/i);
    expect(validateWhatsAppTemplateForm(formWithBody('Hi\n\n\nthere'))).toMatch(/line breaks/i);
  });

  it('rejects http and shortened button URLs', () => {
    const form = formWithBody('Hello friend, please check in today.');
    form.buttons = [{ id: 'b1', type: 'url', text: 'Open', url: 'http://slowburnmethod.in' }];
    expect(validateWhatsAppTemplateForm(form)).toMatch(/https/i);

    form.buttons = [{ id: 'b1', type: 'url', text: 'Open', url: 'https://bit.ly/abc' }];
    expect(validateWhatsAppTemplateForm(form)).toMatch(/shortener/i);
  });

  it('accepts a valid nudge template', () => {
    const form = formWithBody(
      "Hey {{name}}! Haven't seen your logs for the last couple of days. Just a little nudge to do your check-in today."
    );
    expect(validateWhatsAppTemplate('RESET_3Days_missed', form)).toBeNull();
    expect(validateWhatsAppTemplate('reset_3days_missed', form)).toBeNull();
  });
});
