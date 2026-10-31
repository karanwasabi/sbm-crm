'use server';

import { isSuperadmin } from '@/lib/access';
import { createAppPreview, getMyAccess, searchAppPreviewMembers, type AppPreviewMember } from '@/utils/api';

export type AppPreviewSearchResult = { ok: true; members: AppPreviewMember[] } | { ok: false; error: string };

export type AppPreviewMintResult = { ok: true; token: string; expiresAt: string } | { ok: false; error: string };

async function assertSuperadmin(): Promise<string | null> {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) return 'Superadmin required.';
  return null;
}

export async function searchAppPreviewAction(query: string, cohortId: string): Promise<AppPreviewSearchResult> {
  const denied = await assertSuperadmin();
  if (denied) return { ok: false, error: denied };
  try {
    const members = await searchAppPreviewMembers(query, cohortId || null);
    return { ok: true, members };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not search members.';
    return { ok: false, error: message };
  }
}

export async function mintAppPreviewAction(userId: string): Promise<AppPreviewMintResult> {
  const denied = await assertSuperadmin();
  if (denied) return { ok: false, error: denied };
  try {
    const preview = await createAppPreview(userId);
    return { ok: true, token: preview.token, expiresAt: preview.expires_at };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open preview.';
    return { ok: false, error: message };
  }
}
