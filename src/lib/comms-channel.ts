export type CommsChannel = 'email' | 'whatsapp';

export type CommsTab = 'templates' | 'automations' | 'bulk-sends' | 'performance';

export const COMMS_CHANNELS: { id: CommsChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export const COMMS_TABS: { id: CommsTab; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'automations', label: 'Automations' },
  { id: 'bulk-sends', label: 'Bulk sends' },
  { id: 'performance', label: 'Performance' },
];

export function commsBasePath(channel: CommsChannel): string {
  return `/communications/${channel}`;
}

export function commsTabHref(channel: CommsChannel, tab: CommsTab): string {
  return `${commsBasePath(channel)}/${tab}`;
}

export function commsTemplateHref(channel: CommsChannel, templateId?: string | 'new'): string {
  if (!templateId || templateId === 'new') {
    return `${commsBasePath(channel)}/templates/new`;
  }
  return `${commsBasePath(channel)}/templates/${templateId}`;
}

export function commsAutomationHref(channel: CommsChannel, automationId?: string | 'new'): string {
  if (!automationId || automationId === 'new') {
    return `${commsBasePath(channel)}/automations/new`;
  }
  return `${commsBasePath(channel)}/automations/${automationId}`;
}

export function commsBulkSendHref(channel: CommsChannel, jobId?: string): string {
  if (!jobId) {
    return commsTabHref(channel, 'bulk-sends');
  }
  return `${commsBasePath(channel)}/bulk-sends/${jobId}`;
}
