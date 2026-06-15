'use client';

import { useMemo } from 'react';
import { CountryFlag } from '@/components/ui/country-flag';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { COUNTRY_DIAL_CODES, getCountryDialCode } from '@/lib/country-dial-codes';
import type { Country } from '@/types/reference';

type DialCodePickerProps = {
  dialIso: string;
  onChange: (next: { dialCode: string; dialIso: string }) => void;
  countries: Country[];
  disabled?: boolean;
  className?: string;
};

export function DialCodePicker({ dialIso, onChange, countries, disabled, className }: DialCodePickerProps) {
  const options = useMemo(
    () =>
      countries
        .filter((c) => COUNTRY_DIAL_CODES[c.iso_code])
        .map((c) => {
          const dial = COUNTRY_DIAL_CODES[c.iso_code]!;
          return {
            value: c.iso_code,
            label: c.name,
            triggerLabel: dial,
            searchText: `${c.name} ${c.iso_code} ${dial}`,
            icon: <CountryFlag code={c.iso_code} />,
            rightLabel: dial,
          };
        }),
    [countries]
  );

  return (
    <SearchableSelect
      value={dialIso}
      onChange={(iso) => onChange({ dialIso: iso, dialCode: getCountryDialCode(iso) })}
      options={options}
      placeholder="Code"
      searchPlaceholder="Search country or code"
      emptyMessage="No codes match your search."
      disabled={disabled}
      scrollToSelectedOnOpen
      focusSearchOnOpen
      popoverClassName="w-72 min-w-72"
      className={className}
    />
  );
}
