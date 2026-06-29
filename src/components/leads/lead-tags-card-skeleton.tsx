import { TagChipSkeleton } from '@/components/leads/lead-tag-editor';
import { CardSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export function LeadTagsCardSkeleton() {
  return (
    <CardSkeleton padding="sm" className="border-slate-100/80 shadow-none">
      <Skeleton className="mb-2 h-3 w-10" />
      <div className="flex flex-wrap items-center gap-1.5">
        <TagChipSkeleton className="w-16" />
        <TagChipSkeleton className="w-20" />
        <TagChipSkeleton className="w-24" />
        <TagChipSkeleton className="w-28 sm:w-32" />
      </div>
    </CardSkeleton>
  );
}
