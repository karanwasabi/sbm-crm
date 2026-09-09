import { Card } from '@/components/ui/card';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

export default function FeedbackLoading() {
  return (
    <CrmPageLayout className="gap-4">
      <Card>
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </Card>
      <Card>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      </Card>
    </CrmPageLayout>
  );
}
