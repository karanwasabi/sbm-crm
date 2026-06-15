'use client';

import { UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SEX_OPTIONS, type Sex } from '@/types/profile';

type SexSelectProps = {
  value: Sex | '';
  onChange: (value: Sex) => void;
  disabled?: boolean;
};

export function SexSelect({ value, onChange, disabled }: SexSelectProps) {
  const options = useMemo(() => SEX_OPTIONS.map((option) => ({ value: option.value, label: option.label })), []);

  return (
    <SearchableSelect
      value={value}
      onChange={(next) => onChange(next as Sex)}
      options={options}
      placeholder="Select sex"
      leftIcon={<UserRound size={16} />}
      disabled={disabled}
      searchable={false}
    />
  );
}
