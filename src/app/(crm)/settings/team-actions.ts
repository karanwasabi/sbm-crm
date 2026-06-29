'use server';

import { revalidatePath } from 'next/cache';
import { getCrmInviteRedirectURL } from '@/lib/crm-origin';
import type { StaffAccessRole } from '@/lib/access';
import type { CreateStaffInput } from '@/utils/api';
import { createStaff, revokeStaffAccess, updateStaffAccess } from '@/utils/api';

export async function createStaffAction(input: CreateStaffInput) {
  const inviteRedirectTo = await getCrmInviteRedirectURL();
  const result = await createStaff({ ...input, invite_redirect_to: inviteRedirectTo });
  revalidatePath('/settings');
  return result;
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
