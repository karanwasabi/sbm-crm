'use client';

import { X } from 'lucide-react';

type ActiveFilterTagProps = {
  label: string;
  value: string;
  onDismiss?: () => void;
};

export function ActiveFilterTag({ label, value, onDismiss }: ActiveFilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF0FF] px-2.5 py-1 text-[11px] font-semibold text-brand">
      <span className="text-[9px] font-bold tracking-[0.1em] uppercase opacity-70">{label}</span>
      {value}
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="cursor-pointer border-none bg-transparent p-0">
          <X className="h-2.75 w-2.75" />
        </button>
      )}
    </span>
  );
}
