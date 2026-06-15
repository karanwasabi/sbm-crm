'use server';

import { revalidatePath } from 'next/cache';
import type { AppRole } from '@/lib/access';
import { grantRole, revokeRole } from '@/utils/api';

export async function grantRoleAction(email: string, role: AppRole) {
  await grantRole(email, role);
  revalidatePath('/settings');
}

export async function revokeRoleAction(userId: string, role: AppRole) {
  await revokeRole(userId, role);
  revalidatePath('/settings');
}
