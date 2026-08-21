import { redirect } from 'next/navigation';
import { getMyAccess } from '@/utils/api';
import { isMarketingFamily, isMarketingOnly } from '@/lib/access';

/** Plain marketing (not Marketing Plus) lands on lead database instead of dashboard. */
export async function redirectMarketingToDatabase() {
  const access = await getMyAccess();
  if (isMarketingOnly(access.roles)) {
    redirect('/database');
  }
}

/** Marketing and Marketing Plus cannot access admin-only CRM sections. */
export async function redirectMarketingFamilyToDatabase() {
  const access = await getMyAccess();
  if (isMarketingFamily(access.roles)) {
    redirect('/database');
  }
}
