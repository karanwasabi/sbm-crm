'use client';

import { Globe } from 'lucide-react';
import { useMemo, type RefObject } from 'react';
import { CountryFlag } from '@/components/ui/country-flag';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Country } from '@/types/reference';

type CountryComboboxProps = {
  value: string;
  onChange: (isoCode: string) => void;
  countries: Country[];
  disabled?: boolean;
  autoFocus?: boolean;
  focusRef?: RefObject<HTMLButtonElement | null>;
};

export function CountryCombobox({ value, onChange, countries, disabled, autoFocus, focusRef }: CountryComboboxProps) {
  const options = useMemo(
    () =>
      countries.map((c) => ({
        value: c.iso_code,
        label: c.name,
        icon: <CountryFlag code={c.iso_code} />,
      })),
    [countries]
  );

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select country"
      searchPlaceholder="Search country"
      leftIcon={<Globe size={16} />}
      disabled={disabled}
      scrollToSelectedOnOpen
      emptyMessage="No countries match your search."
      autoFocus={autoFocus}
      focusRef={focusRef}
    />
  );
}
