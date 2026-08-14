import type { ReactNode } from 'react';
import { CohortCardGrid } from '@/components/crm/cohort-card-grid';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { partitionProgramCohorts } from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortSummary } from '@/types/crm';

type ProgramsViewProps = {
  cohorts: CohortSummary[];
};

type BandTone = 'live' | 'future' | 'test';

const TITLE_ACCENT: Record<BandTone, { bar: string; title: string; count: string }> = {
  live: {
    bar: 'bg-[#059669]',
    title: 'text-[#065F46]',
    count: 'text-[#047857]',
  },
  future: {
    bar: 'bg-brand',
    title: 'text-brand-press',
    count: 'text-brand',
  },
  test: {
    bar: 'bg-amber-700',
    title: 'text-amber-950',
    count: 'text-amber-800',
  },
};

function SectionTitle({ tone, label, count }: { tone: BandTone; label: string; count: number }) {
  const styles = TITLE_ACCENT[tone];
  return (
    <h2 className="flex items-center gap-2.5">
      <span aria-hidden className={cn('h-5 w-1.5 shrink-0 rounded-full', styles.bar)} />
      <span className={cn('text-base font-extrabold tracking-tight', styles.title)}>{label}</span>
      <span className={cn('text-sm font-bold tabular-nums', styles.count)}>{count}</span>
    </h2>
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center py-1" role="separator">
      <div className="h-px w-full bg-linear-to-r from-transparent via-slate-300 to-transparent" />
    </div>
  );
}

function CohortSection({
  tone,
  label,
  count,
  children,
}: {
  tone: BandTone;
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <SectionTitle tone={tone} label={label} count={count} />
      </div>
      {children}
    </section>
  );
}

export function ProgramsView({ cohorts }: ProgramsViewProps) {
  const { live, futureUpcoming, futureQueued, test } = partitionProgramCohorts(cohorts);
  const futureCount = futureUpcoming.length + futureQueued.length;
  const empty = live.length === 0 && futureCount === 0 && test.length === 0;

  const sections: { key: string; node: ReactNode }[] = [];
  if (live.length > 0) {
    sections.push({
      key: 'live',
      node: (
        <CohortSection tone="live" label="Live" count={live.length}>
          <CohortCardGrid cohorts={live} />
        </CohortSection>
      ),
    });
  }
  if (futureCount > 0) {
    sections.push({
      key: 'future',
      node: (
        <CohortSection tone="future" label="Future" count={futureCount}>
          <CohortCardGrid cohorts={[...futureUpcoming, ...futureQueued]} />
        </CohortSection>
      ),
    });
  }
  if (test.length > 0) {
    sections.push({
      key: 'test',
      node: (
        <CohortSection tone="test" label="Test" count={test.length}>
          <CohortCardGrid cohorts={test} />
        </CohortSection>
      ),
    });
  }

  return (
    <CrmPageLayout>
      {empty ? (
        <CohortCardGrid cohorts={[]} />
      ) : (
        <div className="flex flex-col gap-5">
          {sections.map((section, index) => (
            <div key={section.key} className="flex flex-col gap-5">
              {index > 0 ? <SectionDivider /> : null}
              {section.node}
            </div>
          ))}
        </div>
      )}
    </CrmPageLayout>
  );
}
