'use client';

import { UtensilsCrossed } from 'lucide-react';
import { useMemo, type RefObject } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MEAL_OPTIONS, type MealPreference } from '@/types/profile';

type MealPreferenceSelectProps = {
  value: MealPreference | '';
  onChange: (value: MealPreference) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  focusRef?: RefObject<HTMLButtonElement | null>;
};

export function MealPreferenceSelect({ value, onChange, disabled, autoFocus, focusRef }: MealPreferenceSelectProps) {
  const options = useMemo(() => MEAL_OPTIONS.map((option) => ({ value: option.value, label: option.label })), []);

  return (
    <SearchableSelect
      value={value}
      onChange={(next) => onChange(next as MealPreference)}
      options={options}
      placeholder="Select meal preference"
      leftIcon={<UtensilsCrossed size={16} />}
      disabled={disabled}
      searchable={false}
      autoFocus={autoFocus}
      focusRef={focusRef}
    />
  );
}
