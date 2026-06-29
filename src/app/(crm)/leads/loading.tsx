import { Suspense } from 'react';
import { LeadIntakeLoadingShell } from '@/components/leads/lead-intake-loading-shell';
import { LeadIntakePageSkeleton } from '@/components/leads/lead-intake-skeletons';

export default function LeadsLoading() {
  return (
    <Suspense fallback={<LeadIntakePageSkeleton />}>
      <LeadIntakeLoadingShell />
    </Suspense>
  );
}
