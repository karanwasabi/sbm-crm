import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function ReportDetailLoading() {
  return (
    <CrmPageSkeleton>
      <CardSkeleton>
        <SectionHeadSkeleton />
        <Skeleton className="mt-6 h-96 w-full rounded-xl" />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
