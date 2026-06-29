import { CrmPageSkeleton, FilterBarSkeleton } from '@/components/loading/crm-page-skeleton';
import { LeadDatabaseTableFallback } from '@/components/loading/lead-database-table-fallback';

export default function DatabaseLoading() {
  return (
    <CrmPageSkeleton>
      <FilterBarSkeleton chips={7} />
      <LeadDatabaseTableFallback />
    </CrmPageSkeleton>
  );
}
