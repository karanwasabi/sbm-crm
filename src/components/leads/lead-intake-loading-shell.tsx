'use client';

import { useSearchParams } from 'next/navigation';
import { LeadIntakePageSkeleton } from '@/components/leads/lead-intake-skeletons';

export function LeadIntakeLoadingShell() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return <LeadIntakePageSkeleton tab={tab} />;
}
