'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { Loader2, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  cohortCardGlow,
  cohortCardHref,
  cohortCardSurface,
  formatCohortStartDateCard,
  phasePillTone,
  sortCohorts,
} from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortSummary } from '@/types/crm';

type CohortCardGridProps = {
  cohorts: CohortSummary[];
};

function CohortCardPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/55 backdrop-blur-[1px]"
      aria-hidden
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand" />
    </div>
  );
}

export function CohortCardGrid({ cohorts }: CohortCardGridProps) {
  const sorted = sortCohorts(cohorts);

  if (sorted.length === 0) {
    return <Card className="p-8 text-center text-sm text-slate-500">No cohorts found for this program.</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((cohort) => {
        const glow = cohortCardGlow(cohort.status);
        return (
          <Link
            key={cohort.id}
            href={cohortCardHref(cohort.id)}
            className="group block rounded-[22px] text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            <Card
              padding="sm"
              className={cn(
                'relative h-full p-4 transition group-hover:shadow-sm group-active:scale-[0.99]',
                cohortCardSurface(cohort.status)
              )}
            >
              <CohortCardPending />
              {glow ? (
                <div
                  aria-hidden
                  className={cn('pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl', glow)}
                />
              ) : null}
              <div className="relative z-1">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">Start date</div>
                    <div className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900">
                      {formatCohortStartDateCard(cohort.startsOn)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {cohort.canEdit && (
                      <span className="rounded-full bg-white/70 p-1 text-slate-400 opacity-0 transition group-hover:opacity-100">
                        <Pencil className="h-3 w-3" />
                      </span>
                    )}
                    <Pill tone={phasePillTone(cohort.phaseLabel)}>{cohort.phaseLabel}</Pill>
                  </div>
                </div>

                <div className="text-[13px] font-bold text-slate-700">{cohort.name}</div>

                <div className="mt-3 border-t border-black/5 pt-3">
                  <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Members</div>
                  <div className="text-xl font-extrabold text-slate-800 tabular-nums">{cohort.memberCount}</div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
