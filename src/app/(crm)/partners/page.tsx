import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { PartnerAPIManagerView } from '@/components/views/partner-api-manager-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, listPartnerAPIClients } from '@/utils/api';

export default async function PartnersPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const clients = await listPartnerAPIClients().catch(() => []);

  return (
    <CrmPageLayout>
      <PartnerAPIManagerView clients={clients} />
    </CrmPageLayout>
  );
}
