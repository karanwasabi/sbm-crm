import { redirect } from 'next/navigation';
import { getMyAccess } from '@/utils/api';
import { isMarketingOnly, type AppRole } from '@/lib/access';

export async function redirectMarketingToDatabase() {
  const access = await getMyAccess();
  if (isMarketingOnly(access.roles)) {
    redirect('/database');
  }
}

export function marketingDefaultCreatedByMe(roles: AppRole[]): boolean {
  return isMarketingOnly(roles);
}
