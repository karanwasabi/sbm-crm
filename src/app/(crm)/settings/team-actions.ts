'use server';

import { revalidatePath } from 'next/cache';
import { getCrmInviteRedirectURL } from '@/lib/crm-origin';
import type { StaffAccessRole } from '@/lib/access';
import type { CreateStaffInput, StaffMember } from '@/utils/api';
import { createStaff, revokeStaffAccess, updateStaffAccess } from '@/utils/api';

export async function createStaffAction(
  input: CreateStaffInput
): Promise<{ ok: true; member: StaffMember } | { ok: false; error: string }> {
  try {
    const inviteRedirectTo = await getCrmInviteRedirectURL();
    const result = await createStaff({ ...input, invite_redirect_to: inviteRedirectTo });
    revalidatePath('/settings');
    return { ok: true, member: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add staff member.';
    return { ok: false, error: message };
  }
}

export async function updateStaffAccessAction(userId: string, roles: StaffAccessRole[]) {
  const result = await updateStaffAccess(userId, roles);
  revalidatePath('/settings');
  return result;
}

export async function revokeStaffAccessAction(userId: string) {
  await revokeStaffAccess(userId);
  revalidatePath('/settings');
}
