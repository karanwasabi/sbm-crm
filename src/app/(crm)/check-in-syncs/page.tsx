import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { CheckInSyncsView } from '@/components/views/check-in-syncs-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, listCheckInSyncIssues } from '@/utils/api';

export default async function CheckInSyncsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const params = await searchParams;
  const status = params.status?.trim() || undefined;
  const data = await listCheckInSyncIssues(status).catch(() => ({ count: 0, issues: [] }));

  return (
    <CrmPageLayout>
      <CheckInSyncsView count={data.count} issues={data.issues} status={status ?? ''} />
    </CrmPageLayout>
  );
}
