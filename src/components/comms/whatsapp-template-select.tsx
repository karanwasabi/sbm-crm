'use client';

import { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { whatsAppTemplateSelectOptions } from '@/lib/whatsapp-template-display';
import { cn } from '@/lib/cn';
import type { WhatsAppTemplate } from '@/utils/api';

type WhatsAppTemplateSelectProps = {
  templates: WhatsAppTemplate[];
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverClassName?: string;
};

export function WhatsAppTemplateSelect({
  templates,
  value,
  onChange,
  disabled,
  placeholder = 'Select template…',
  emptyMessage = 'No templates found.',
  className,
  popoverClassName = 'w-[min(100vw-2rem,28rem)]',
}: WhatsAppTemplateSelectProps) {
  const options = useMemo(() => whatsAppTemplateSelectOptions(templates), [templates]);
  const selectedPreview = useMemo(() => options.find((option) => option.value === value)?.subtitle, [options, value]);

  return (
    <div className="flex flex-col gap-2">
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        disabled={disabled}
        searchable
        scrollToSelectedOnOpen
        className={cn('h-auto min-h-11 py-2', className)}
        popoverClassName={popoverClassName}
      />
      {value && selectedPreview ? (
        <p className="rounded-xl border border-slate-200 bg-canvas-cool px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
          {selectedPreview}
        </p>
      ) : null}
    </div>
  );
}
