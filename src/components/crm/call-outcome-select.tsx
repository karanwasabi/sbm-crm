'use client';

import { PhoneCall } from 'lucide-react';
import { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CONTACT_OUTCOME_OPTIONS, type ContactOutcome } from '@/types/crm';

type CallOutcomeSelectProps = {
  value: ContactOutcome | '';
  onChange: (value: ContactOutcome) => void;
  disabled?: boolean;
};

export function CallOutcomeSelect({ value, onChange, disabled }: CallOutcomeSelectProps) {
  const options = useMemo(
    () => CONTACT_OUTCOME_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    []
  );

  return (
    <SearchableSelect
      value={value}
      onChange={(next) => onChange(next as ContactOutcome)}
      options={options}
      placeholder="Select outcome"
      leftIcon={<PhoneCall size={16} />}
      disabled={disabled}
      searchable={false}
    />
  );
}
