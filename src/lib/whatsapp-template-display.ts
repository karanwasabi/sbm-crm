import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { whatsAppTemplateCategoryLabel } from '@/lib/whatsapp-template-types';
import type { WhatsAppTemplate } from '@/utils/api';

const PREVIEW_MAX_LENGTH = 160;

function truncatePreview(text: string, max = PREVIEW_MAX_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function extractPreviewFromUnknown(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return extractPreviewFromUnknown(JSON.parse(trimmed), depth + 1);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractPreviewFromUnknown(item, depth + 1);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;

  if (typeof record.text === 'string' && record.text.trim()) {
    return record.text;
  }
  if (typeof record.body === 'string' && record.body.trim()) {
    return record.body;
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  if (typeof record.caption === 'string' && record.caption.trim()) {
    return record.caption;
  }

  if (record.body && typeof record.body === 'object') {
    const nested = extractPreviewFromUnknown(record.body, depth + 1);
    if (nested) return nested;
  }

  if (Array.isArray(record.components)) {
    const bodyParts = record.components
      .map((component) => {
        if (!component || typeof component !== 'object') return null;
        const item = component as Record<string, unknown>;
        const type = String(item.type ?? '').toUpperCase();
        if (type && type !== 'BODY' && type !== 'HEADER' && type !== 'FOOTER') return null;
        return typeof item.text === 'string' ? item.text.trim() : null;
      })
      .filter((part): part is string => Boolean(part));
    if (bodyParts.length > 0) {
      return bodyParts.join(' · ');
    }
  }

  for (const key of ['live_content', 'content', 'template', 'message', 'messages', 'body']) {
    if (key in record) {
      const nested = extractPreviewFromUnknown(record[key], depth + 1);
      if (nested) return nested;
    }
  }

  return null;
}

export function whatsAppTemplatePreviewText(template: Pick<WhatsAppTemplate, 'content' | 'liveContent'>): string {
  const fromLive = extractPreviewFromUnknown(template.liveContent);
  if (fromLive) return truncatePreview(fromLive);

  const fromContent = extractPreviewFromUnknown(template.content);
  if (fromContent) return truncatePreview(fromContent);

  return 'No preview available';
}

export function whatsAppTemplateSelectOptions(templates: WhatsAppTemplate[]): SearchableSelectOption[] {
  return templates.map((template) => {
    const preview = whatsAppTemplatePreviewText(template);
    const category = whatsAppTemplateCategoryLabel(template.category);
    return {
      value: template.id,
      label: template.name,
      triggerLabel: template.name,
      subtitle: preview,
      searchText: `${template.name} ${category} ${preview}`,
      rightLabel: category,
    };
  });
}
