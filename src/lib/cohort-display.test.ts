import { describe, expect, it } from 'vitest';
import { firstLiveCohortId, partitionCohorts, partitionProgramCohorts } from '@/lib/cohort-display';

function cohort(partial: { id: string; startsOn: string; status: string; isLive: boolean }) {
  return partial;
}

const samples = [
  cohort({ id: 'queued', startsOn: '2026-10-05', status: 'queued', isLive: true }),
  cohort({ id: 'test-old', startsOn: '2026-01-12', status: 'inactive', isLive: false }),
  cohort({ id: 'live-new', startsOn: '2026-07-20', status: 'active', isLive: true }),
  cohort({ id: 'upcoming', startsOn: '2026-08-17', status: 'upcoming', isLive: true }),
  cohort({ id: 'live-old', startsOn: '2026-04-13', status: 'locked', isLive: true }),
  cohort({ id: 'test-demo', startsOn: '2026-07-13', status: 'active', isLive: false }),
];

describe('partitionProgramCohorts', () => {
  it('puts running live first by start date, then upcoming, queued, then test', () => {
    const { live, futureUpcoming, futureQueued, test } = partitionProgramCohorts(samples);
    expect(live.map((c) => c.id)).toEqual(['live-new', 'live-old']);
    expect(futureUpcoming.map((c) => c.id)).toEqual(['upcoming']);
    expect(futureQueued.map((c) => c.id)).toEqual(['queued']);
    expect(test.map((c) => c.id)).toEqual(['test-demo', 'test-old']);
  });
});

describe('partitionCohorts', () => {
  it('keeps future after live and before test', () => {
    const { live, future, test } = partitionCohorts(samples);
    expect(live.map((c) => c.id)).toEqual(['live-new', 'live-old']);
    expect(future.map((c) => c.id)).toEqual(['upcoming', 'queued']);
    expect(test.map((c) => c.id)).toEqual(['test-demo', 'test-old']);
  });
});

describe('firstLiveCohortId', () => {
  it('prefers a running live cohort over upcoming', () => {
    expect(firstLiveCohortId(samples)).toBe('live-new');
  });

  it('falls back to upcoming when nothing is live', () => {
    expect(
      firstLiveCohortId([
        cohort({ id: 'queued', startsOn: '2026-10-05', status: 'queued', isLive: true }),
        cohort({ id: 'upcoming', startsOn: '2026-08-17', status: 'upcoming', isLive: true }),
        cohort({ id: 'test', startsOn: '2026-07-13', status: 'active', isLive: false }),
      ])
    ).toBe('upcoming');
  });
});
