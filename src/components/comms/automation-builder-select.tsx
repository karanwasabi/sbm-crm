'use client';

import { useMemo } from 'react';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';

type AutomationBuilderSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
};

export function AutomationBuilderSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  searchable = false,
  className,
}: AutomationBuilderSelectProps) {
  const stableOptions = useMemo(() => options, [options]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={stableOptions}
      placeholder={placeholder}
      disabled={disabled}
      searchable={searchable}
      className={className}
      popoverClassName="w-[var(--anchor-width)]"
    />
  );
}
