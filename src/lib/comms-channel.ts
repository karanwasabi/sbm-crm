export type CommsChannel = 'email' | 'whatsapp';

export type CommsChannelTab = 'templates' | 'bulk-sends' | 'performance';

export type CommsSection = 'automations' | CommsChannel;

export const COMMS_CHANNELS: { id: CommsChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export const COMMS_CHANNEL_TABS: { id: CommsChannelTab; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'bulk-sends', label: 'Bulk sends' },
  { id: 'performance', label: 'Performance' },
];

export const COMMS_AUTOMATIONS_HREF = '/communications/automations';

export function commsBasePath(channel: CommsChannel): string {
  return `/communications/${channel}`;
}

export function commsTabHref(channel: CommsChannel, tab: CommsChannelTab): string {
  return `${commsBasePath(channel)}/${tab}`;
}

export function commsTemplateHref(channel: CommsChannel, templateId?: string | 'new'): string {
  if (!templateId || templateId === 'new') {
    return `${commsBasePath(channel)}/templates/new`;
  }
  return `${commsBasePath(channel)}/templates/${templateId}`;
}

export function commsAutomationHref(automationId?: string | 'new'): string {
  if (!automationId || automationId === 'new') {
    return `${COMMS_AUTOMATIONS_HREF}/new`;
  }
  return `${COMMS_AUTOMATIONS_HREF}/${automationId}`;
}

export function commsBulkSendHref(channel: CommsChannel, jobId?: string): string {
  if (!jobId) {
    return commsTabHref(channel, 'bulk-sends');
  }
  return `${commsBasePath(channel)}/bulk-sends/${jobId}`;
}
