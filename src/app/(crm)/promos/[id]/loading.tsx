import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { DetailHeroSkeleton, StatTilesSkeleton } from '@/components/loading/detail-hero-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function PromoDetailLoading() {
  return (
    <CrmPageSkeleton>
      <Skeleton className="h-4 w-24" />
      <DetailHeroSkeleton />
      <StatTilesSkeleton count={3} />
      <CardSkeleton padding="sm">
        <Skeleton className="h-4 w-32" />
      </CardSkeleton>
      <TableSkeleton columns={6} rows={4} />
    </CrmPageSkeleton>
  );
}
