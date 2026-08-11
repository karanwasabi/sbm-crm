'use client';

import { createClient } from '@/utils/supabase/client';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not authenticated.');
  }
  return token;
}

function mapEmailTemplate(row: {
  id: string;
  name: string;
  classification: string;
  layout: string;
  subject: string;
  from_name?: string | null;
  from_local_part?: string | null;
  content_json: unknown;
  html_compiled: string;
  text_compiled: string;
  status: string;
  created_at: string;
  updated_at: string;
}): EmailTemplate {
  const contentJson =
    row.content_json && typeof row.content_json === 'object' && !Array.isArray(row.content_json)
      ? (row.content_json as EmailTemplate['contentJson'])
      : {};

  return {
    id: row.id,
    name: row.name,
    classification: row.classification as EmailTemplate['classification'],
    layout: row.layout as EmailTemplate['layout'],
    subject: row.subject,
    fromName: row.from_name ?? null,
    fromLocalPart: row.from_local_part ?? null,
    contentJson,
    htmlCompiled: row.html_compiled,
    textCompiled: row.text_compiled,
    status: row.status as EmailTemplate['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWhatsAppTemplate(row: {
  id: string;
  convonite_id?: string;
  name: string;
  status: string;
  category: string;
  language: string;
  purpose: string;
  runtime_params: unknown;
  content: unknown;
  live_content?: unknown;
  rating?: string;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}): WhatsAppTemplate {
  return {
    id: row.id,
    convoniteId: row.convonite_id,
    name: row.name,
    status: row.status as WhatsAppTemplate['status'],
    category: row.category as WhatsAppTemplate['category'],
    language: row.language,
    purpose: row.purpose as WhatsAppTemplate['purpose'],
    runtimeParams: row.runtime_params ?? [],
    content: row.content ?? {},
    liveContent: row.live_content ?? null,
    rating: row.rating,
    lastSyncedAt: row.last_synced_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchEmailTemplatesClient(): Promise<EmailTemplate[]> {
  const token = await getAccessToken();
  const response = await fetch(`${getBackendUrl()}/admin/comms/templates`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load email templates.');
  }
  const rows = (await response.json()) as Parameters<typeof mapEmailTemplate>[0][];
  return rows.map(mapEmailTemplate);
}

export async function fetchWhatsAppTemplatesClient(): Promise<WhatsAppTemplate[]> {
  const token = await getAccessToken();
  const response = await fetch(`${getBackendUrl()}/admin/comms/whatsapp/templates`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load WhatsApp templates.');
  }
  const rows = (await response.json()) as Parameters<typeof mapWhatsAppTemplate>[0][];
  return rows.map(mapWhatsAppTemplate);
}
