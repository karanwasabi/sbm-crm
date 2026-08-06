import { redirect } from 'next/navigation';
import { getMyAccess } from '@/utils/api';
import { isMarketingOnly } from '@/lib/access';

export async function redirectMarketingToDatabase() {
  const access = await getMyAccess();
  if (isMarketingOnly(access.roles)) {
    redirect('/database');
  }
}
