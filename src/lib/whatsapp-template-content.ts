export type WhatsAppHeaderFormat = 'none' | 'text';

export type WhatsAppButtonType = 'url' | 'quick_reply' | 'phone';

export type WhatsAppLeadField =
  | ''
  | 'first_name'
  | 'last_name'
  | 'name'
  | 'email'
  | 'city'
  | 'country'
  | 'program_interest'
  | 'batch'
  | 'program_name'
  | 'cohort_name'
  | 'cohort_starts_on'
  | 'enrollment_status'
  | 'portal'
  | 'website';

export type WhatsAppTemplateVariable = {
  name: string;
  example: string;
  leadField: WhatsAppLeadField;
};

export type WhatsAppTemplateButton = {
  id: string;
  type: WhatsAppButtonType;
  text: string;
  url?: string;
  phone?: string;
};

export type WhatsAppTemplateFormContent = {
  description: string;
  headerFormat: WhatsAppHeaderFormat;
  headerText: string;
  body: string;
  footer: string;
  variables: WhatsAppTemplateVariable[];
  buttons: WhatsAppTemplateButton[];
};

/** Shared catalog aligned with backend whatsAppLeadField catalog. */
export const WHATSAPP_VARIABLE_CATALOG: {
  field: Exclude<WhatsAppLeadField, ''>;
  token: string;
  label: string;
  insertLabel: string;
}[] = [
  { field: 'first_name', token: '{{first_name}}', label: 'Lead — first name', insertLabel: 'First name' },
  { field: 'last_name', token: '{{last_name}}', label: 'Lead — last name', insertLabel: 'Last name' },
  { field: 'name', token: '{{name}}', label: 'Lead — full name', insertLabel: 'Full name' },
  { field: 'email', token: '{{email}}', label: 'Lead — email', insertLabel: 'Email' },
  { field: 'city', token: '{{city}}', label: 'Lead — city', insertLabel: 'City' },
  { field: 'country', token: '{{country}}', label: 'Lead — country', insertLabel: 'Country' },
  {
    field: 'program_interest',
    token: '{{program_interest}}',
    label: 'Lead — program interest',
    insertLabel: 'Program interest',
  },
  { field: 'batch', token: '{{batch}}', label: 'Lead — batch', insertLabel: 'Batch' },
  { field: 'program_name', token: '{{program_name}}', label: 'Member — program name', insertLabel: 'Program name' },
  { field: 'cohort_name', token: '{{cohort_name}}', label: 'Member — cohort name', insertLabel: 'Cohort name' },
  {
    field: 'cohort_starts_on',
    token: '{{cohort_starts_on}}',
    label: 'Member — cohort start',
    insertLabel: 'Cohort start',
  },
  {
    field: 'enrollment_status',
    token: '{{enrollment_status}}',
    label: 'Member — enrollment status',
    insertLabel: 'Enrollment status',
  },
  { field: 'portal', token: '{{portal}}', label: 'Link — portal', insertLabel: 'Portal link' },
  { field: 'website', token: '{{website}}', label: 'Link — website', insertLabel: 'Website link' },
];

export const WHATSAPP_LEAD_FIELD_OPTIONS: { value: WhatsAppLeadField; label: string }[] = [
  { value: '', label: 'Custom (sample = default send value)' },
  ...WHATSAPP_VARIABLE_CATALOG.map((item) => ({ value: item.field as WhatsAppLeadField, label: item.label })),
];

export const WHATSAPP_INSERT_VARIABLE_OPTIONS = WHATSAPP_VARIABLE_CATALOG.map((item) => ({
  token: item.token,
  label: item.insertLabel,
}));

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function extractVariableNames(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    names.add(raw);
  }
  return [...names];
}

export function guessLeadField(variableName: string): WhatsAppLeadField {
  const normalized = variableName.toLowerCase().replace(/[\s-]/g, '_');
  const catalogMatch = WHATSAPP_VARIABLE_CATALOG.find(
    (item) => item.field === normalized || item.token === `{{${normalized}}}`
  );
  if (catalogMatch) return catalogMatch.field;
  if (normalized === 'firstname' || normalized === 'fname') return 'first_name';
  if (normalized === 'lastname' || normalized === 'lname') return 'last_name';
  if (normalized === 'full_name' || normalized === 'fullname') return 'name';
  if (normalized === 'program') return 'program_interest';
  if (normalized === 'cohort') return 'cohort_name';
  if (normalized === 'starts_on' || normalized === 'start_date') return 'cohort_starts_on';
  if (normalized === 'status') return 'enrollment_status';
  if (normalized === 'portal_url') return 'portal';
  if (normalized === 'website_url') return 'website';
  return '';
}

export function defaultVariableExample(variableName: string, leadField: WhatsAppLeadField): string {
  if (leadField === 'first_name') return 'Alex';
  if (leadField === 'last_name') return 'Sharma';
  if (leadField === 'name') return 'Alex Sharma';
  if (leadField === 'email') return 'alex@example.com';
  if (leadField === 'city') return 'Mumbai';
  if (leadField === 'country') return 'India';
  if (leadField === 'program_interest' || leadField === 'program_name') return 'Take Control';
  if (leadField === 'batch' || leadField === 'cohort_name') return 'Cohort 12';
  if (leadField === 'cohort_starts_on') return '3 July 2026';
  if (leadField === 'enrollment_status') return 'Currently enrolled';
  if (leadField === 'portal') return 'https://portal.slowburnmethod.in';
  if (leadField === 'website') return 'https://slowburnmethod.in';
  if (variableName.toLowerCase().includes('link') || variableName.toLowerCase().includes('url')) {
    return 'https://slowburnmethod.in';
  }
  return variableName.charAt(0).toUpperCase() + variableName.slice(1);
}

export function mergeVariablesFromText(text: string, existing: WhatsAppTemplateVariable[]): WhatsAppTemplateVariable[] {
  const names = extractVariableNames(text);
  const byName = new Map(existing.map((variable) => [variable.name, variable]));

  return names.map((name) => {
    const prior = byName.get(name);
    if (prior) return prior;
    const leadField = guessLeadField(name);
    return {
      name,
      leadField,
      example: defaultVariableExample(name, leadField),
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  if (record && typeof record.text === 'string') return record.text;
  return '';
}

function leadFieldFromParam(param: Record<string, unknown>): WhatsAppLeadField {
  const field = asRecord(param.field);
  if (!field || typeof field.name !== 'string') return '';
  const name = field.name as WhatsAppLeadField;
  return WHATSAPP_LEAD_FIELD_OPTIONS.some((option) => option.value === name) ? name : '';
}

function parseVariablesFromParams(params: unknown): WhatsAppTemplateVariable[] {
  if (!Array.isArray(params)) return [];
  return params
    .map((item) => {
      const param = asRecord(item);
      if (!param || typeof param.name !== 'string') return null;
      return {
        name: param.name,
        example: typeof param.example === 'string' ? param.example : '',
        leadField: leadFieldFromParam(param),
      } satisfies WhatsAppTemplateVariable;
    })
    .filter((item): item is WhatsAppTemplateVariable => item != null);
}

function parseButtonsFromUnknown(buttons: unknown): WhatsAppTemplateButton[] {
  if (!Array.isArray(buttons)) return [];

  const parsed: WhatsAppTemplateButton[] = [];

  buttons.forEach((item, index) => {
    const button = asRecord(item);
    if (!button || typeof button.text !== 'string') return;

    const rawType = String(button.type ?? '').toUpperCase();
    let type: WhatsAppButtonType = 'quick_reply';
    if (rawType === 'URL' || rawType === 'url') type = 'url';
    if (rawType === 'PHONE_NUMBER' || rawType === 'phone' || rawType === 'PHONE') type = 'phone';

    const entry: WhatsAppTemplateButton = {
      id: `btn-${index}`,
      type,
      text: button.text,
    };
    if (typeof button.url === 'string') entry.url = button.url;
    if (typeof button.phone === 'string') entry.phone = button.phone;
    else if (typeof button.phone_number === 'string') entry.phone = button.phone_number;

    parsed.push(entry);
  });

  return parsed;
}

function parseFromComponents(components: unknown[]): Partial<WhatsAppTemplateFormContent> {
  const partial: Partial<WhatsAppTemplateFormContent> = {
    headerFormat: 'none',
    headerText: '',
    body: '',
    footer: '',
    buttons: [],
  };

  for (const item of components) {
    const component = asRecord(item);
    if (!component) continue;
    const type = String(component.type ?? '').toUpperCase();

    if (type === 'BODY' && typeof component.text === 'string') {
      partial.body = component.text;
    }
    if (type === 'HEADER') {
      const format = String(component.format ?? 'TEXT').toUpperCase();
      if (format === 'TEXT' && typeof component.text === 'string') {
        partial.headerFormat = 'text';
        partial.headerText = component.text;
      }
    }
    if (type === 'FOOTER' && typeof component.text === 'string') {
      partial.footer = component.text;
    }
    if (type === 'BUTTONS') {
      partial.buttons = parseButtonsFromUnknown(component.buttons);
    }
  }

  return partial;
}

export function emptyWhatsAppTemplateFormContent(): WhatsAppTemplateFormContent {
  return {
    description: '',
    headerFormat: 'none',
    headerText: '',
    body: '',
    footer: '',
    variables: [],
    buttons: [],
  };
}

export function parseWhatsAppTemplateContent(content: unknown, runtimeParams?: unknown): WhatsAppTemplateFormContent {
  const form = emptyWhatsAppTemplateFormContent();
  const record = asRecord(content);
  if (!record) return form;

  if (typeof record.description === 'string') {
    form.description = record.description;
  }

  const bodyText = readText(record.body);
  if (bodyText) {
    form.body = bodyText;
  }

  const header = asRecord(record.header);
  if (header) {
    const format = String(header.format ?? 'TEXT').toUpperCase();
    if (format === 'TEXT') {
      form.headerFormat = 'text';
      form.headerText = readText(header);
    }
  }

  const footerText = readText(record.footer);
  if (footerText) {
    form.footer = footerText;
  }

  if (Array.isArray(record.components)) {
    const fromComponents = parseFromComponents(record.components);
    if (!form.body && fromComponents.body) form.body = fromComponents.body;
    if (fromComponents.headerFormat === 'text') {
      form.headerFormat = 'text';
      form.headerText = fromComponents.headerText ?? '';
    }
    if (!form.footer && fromComponents.footer) form.footer = fromComponents.footer;
    if (fromComponents.buttons?.length) form.buttons = fromComponents.buttons;
  }

  const bodyRecord = asRecord(record.body);
  let variables = parseVariablesFromParams(record.params);
  if (variables.length === 0 && bodyRecord) {
    variables = parseVariablesFromParams(bodyRecord.params);
  }
  if (variables.length === 0 && Array.isArray(runtimeParams)) {
    variables = parseVariablesFromParams(runtimeParams);
  }
  if (variables.length === 0) {
    variables = mergeVariablesFromText(form.body, []);
  } else {
    variables = mergeVariablesFromText(form.body, variables);
  }
  form.variables = variables;

  if (Array.isArray(record.buttons) && record.buttons.length > 0) {
    form.buttons = parseButtonsFromUnknown(record.buttons);
  }

  return form;
}

function buildParamField(leadField: WhatsAppLeadField): Record<string, string> | undefined {
  if (!leadField) return undefined;
  return { name: leadField, module: 'contacts' };
}

function buildContentButtons(buttons: WhatsAppTemplateButton[]): Record<string, unknown>[] {
  return buttons
    .filter((button) => button.text.trim())
    .map((button) => {
      if (button.type === 'url') {
        return {
          type: 'url',
          text: button.text.trim(),
          url: button.url?.trim() || 'https://slowburnmethod.in',
        };
      }
      if (button.type === 'phone') {
        return {
          type: 'phone_number',
          text: button.text.trim(),
          phone_number: button.phone?.trim() || '',
        };
      }
      return {
        type: 'quick_reply',
        text: button.text.trim(),
      };
    });
}

export function buildWhatsAppTemplateContent(form: WhatsAppTemplateFormContent): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  if (form.description.trim()) {
    content.description = form.description.trim();
  }

  if (form.headerFormat === 'text' && form.headerText.trim()) {
    content.header = {
      format: 'text',
      text: form.headerText.trim(),
    };
  }

  const body: Record<string, unknown> = {
    text: form.body,
  };

  const params = form.variables
    .filter((variable) => variable.name.trim())
    .map((variable) => {
      const param: Record<string, unknown> = {
        name: variable.name.trim(),
        example: variable.example.trim() || defaultVariableExample(variable.name, variable.leadField),
      };
      const field = buildParamField(variable.leadField);
      if (field) param.field = field;
      return param;
    });

  if (params.length > 0) {
    body.params = params;
  }

  content.body = body;

  if (form.footer.trim()) {
    content.footer = {
      text: form.footer.trim(),
    };
  }

  const buttons = buildContentButtons(form.buttons);
  if (buttons.length > 0) {
    content.buttons = buttons;
  }

  return content;
}

export function buildWhatsAppRuntimeParams(_form: WhatsAppTemplateFormContent): unknown[] {
  return [];
}

export function renderWhatsAppPreviewText(
  form: WhatsAppTemplateFormContent,
  samples?: Record<string, string>
): { header?: string; body: string; footer?: string; buttons: string[] } {
  const sampleMap = new Map<string, string>();
  for (const variable of form.variables) {
    sampleMap.set(variable.name, variable.example.trim() || defaultVariableExample(variable.name, variable.leadField));
  }
  if (samples) {
    for (const [key, value] of Object.entries(samples)) {
      sampleMap.set(key, value);
    }
  }

  const substitute = (text: string) =>
    text.replace(VARIABLE_PATTERN, (_match, rawName: string) => {
      const name = rawName.trim();
      return sampleMap.get(name) ?? name;
    });

  return {
    header: form.headerFormat === 'text' && form.headerText.trim() ? substitute(form.headerText) : undefined,
    body: substitute(form.body),
    footer: form.footer.trim() ? substitute(form.footer) : undefined,
    buttons: form.buttons.map((button) => button.text.trim()).filter(Boolean),
  };
}

export function validateWhatsAppTemplateForm(form: WhatsAppTemplateFormContent): string | null {
  if (!form.body.trim()) {
    return 'Message body is required.';
  }

  for (const variable of form.variables) {
    if (!variable.example.trim()) {
      return `Add a sample value for {{${variable.name}}}. Meta requires examples for approval.`;
    }
  }

  for (const button of form.buttons) {
    if (!button.text.trim()) continue;
    if (button.type === 'url' && !button.url?.trim()) {
      return `Button "${button.text}" needs a URL.`;
    }
    if (button.type === 'phone' && !button.phone?.trim()) {
      return `Button "${button.text}" needs a phone number.`;
    }
  }

  if (form.buttons.filter((button) => button.text.trim()).length > 3) {
    return 'WhatsApp allows up to 3 buttons per template.';
  }

  return null;
}

export function newWhatsAppButtonId(): string {
  return `btn-${Math.random().toString(36).slice(2, 9)}`;
}
