import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { PromosPageClient } from '@/components/views/promos-page-client';
import { listPromoCodes } from '@/utils/api';

export default async function PromosPage() {
  let items: Awaited<ReturnType<typeof listPromoCodes>> = [];
  try {
    items = await listPromoCodes();
  } catch {
    items = [];
  }

  return (
    <CrmPageLayout>
      <PromosPageClient items={items} />
    </CrmPageLayout>
  );
}
