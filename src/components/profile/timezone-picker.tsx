'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { getOnboardingTimezoneGroups } from '@/domain/onboarding-timezones';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { normalizeProfileTimezoneForDb } from '@/lib/profile-timezone';

type TimezonePickerProps = {
  value: string;
  onChange: (ianaId: string) => void;
  disabled?: boolean;
};

export function TimezonePicker({ value, onChange, disabled = false }: TimezonePickerProps) {
  const groups = useMemo(() => getOnboardingTimezoneGroups(), []);

  const options = useMemo(() => {
    const seen = new Map<
      string,
      { value: string; label: string; searchText: string; subtitle: string; rightLabel: string }
    >();
    for (const group of groups) {
      const pickedId = group.ids[0]!;
      const canonical = normalizeProfileTimezoneForDb(pickedId) ?? pickedId;
      if (seen.has(canonical)) continue;
      seen.set(canonical, {
        value: canonical,
        label: group.title,
        searchText: `${group.title} ${group.searchString}`,
        subtitle: group.regionLabel,
        rightLabel: group.offsetStr,
      });
    }
    return [...seen.values()];
  }, [groups]);

  const resolvedValue = value ? (normalizeProfileTimezoneForDb(value) ?? value) : '';

  return (
    <SearchableSelect
      value={resolvedValue}
      onChange={onChange}
      options={options}
      placeholder="Select timezone"
      searchPlaceholder="Search city, region, or UTC offset"
      leftIcon={<Clock size={16} />}
      disabled={disabled}
      scrollToSelectedOnOpen
      emptyMessage="No timezones match your search."
    />
  );
}
