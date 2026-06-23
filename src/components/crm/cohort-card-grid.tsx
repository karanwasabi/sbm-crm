'use client';

import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  cohortCardHref,
  formatCohortStartDate,
  isInactiveCohort,
  phasePillTone,
  sortCohorts,
} from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortSummary } from '@/types/crm';

type CohortCardGridProps = {
  cohorts: CohortSummary[];
};

export function CohortCardGrid({ cohorts }: CohortCardGridProps) {
  const router = useRouter();
  const sorted = sortCohorts(cohorts);

  if (sorted.length === 0) {
    return <Card className="p-8 text-center text-sm text-slate-500">No cohorts found for this program.</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((cohort) => {
        const inactive = isInactiveCohort(cohort.status);
        return (
          <Card
            key={cohort.id}
            padding="sm"
            className={cn(
              'group cursor-pointer p-4 transition hover:border-brand/30 hover:shadow-sm',
              inactive && 'opacity-60'
            )}
            onClick={() => router.push(cohortCardHref(cohort.id))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(cohortCardHref(cohort.id));
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-bold text-slate-800">{cohort.name}</div>
                <div className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  Starts {formatCohortStartDate(cohort.startsOn)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {cohort.canEdit && (
                  <span className="rounded-full bg-canvas-cool p-1 text-slate-400 opacity-0 transition group-hover:opacity-100">
                    <Pencil className="h-3 w-3" />
                  </span>
                )}
                <Pill tone={phasePillTone(cohort.phaseLabel)}>{cohort.phaseLabel}</Pill>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Members</div>
                <div className="text-xl font-extrabold text-slate-800 tabular-nums">{cohort.memberCount}</div>
              </div>
              <div className="h-2 w-2 rounded-full" style={{ background: cohort.color }} aria-hidden />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
