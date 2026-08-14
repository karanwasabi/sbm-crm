import { firstLiveCohortId, partitionCohorts } from '@/lib/cohort-display';

type CohortSelectItem = {
  id: string;
  startsOn: string;
  isLive?: boolean;
  status?: string;
};

type CohortSelectOptGroupsProps<T extends CohortSelectItem> = {
  cohorts: T[];
  labelFor: (cohort: T) => string;
  emptyLabel?: string;
};

export function CohortSelectOptGroups<T extends CohortSelectItem>({
  cohorts,
  labelFor,
  emptyLabel = 'No cohorts',
}: CohortSelectOptGroupsProps<T>) {
  if (cohorts.length === 0) {
    return <option value="">{emptyLabel}</option>;
  }

  const { live, test } = partitionCohorts(cohorts);

  return (
    <>
      {live.length > 0 ? (
        <optgroup label="Live">
          {live.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {labelFor(cohort)}
            </option>
          ))}
        </optgroup>
      ) : null}
      {test.length > 0 ? (
        <optgroup label="Test">
          {test.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {labelFor(cohort)}
            </option>
          ))}
        </optgroup>
      ) : null}
    </>
  );
}

export function defaultCohortSelectValue<T extends CohortSelectItem>(cohorts: T[]): string {
  return firstLiveCohortId(cohorts);
}
