import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { DetailHeroSkeleton } from '@/components/loading/detail-hero-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { CardSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { LeadTagsCardSkeleton } from '@/components/leads/lead-tags-card-skeleton';

export default function CustomerDetailLoading() {
  return (
    <CrmPageSkeleton>
      <DetailHeroSkeleton />
      <LeadTagsCardSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton padding="sm">
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </CardSkeleton>
        <CardSkeleton padding="sm">
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </CardSkeleton>
      </div>
      <TableSkeleton columns={5} rows={5} />
    </CrmPageSkeleton>
  );
}
