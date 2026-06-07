import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  return (
    <CrmPageLayout>
      <p className="text-sm text-slate-500">Customer {id} loading…</p>
    </CrmPageLayout>
  );
}
