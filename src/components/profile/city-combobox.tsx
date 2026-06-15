'use client';

import { Check, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { TextInput } from '@/components/ui/text-input';
import { toTitleCase } from '@/lib/title-case';
import { cn } from '@/lib/utils';
import type { CountryCity } from '@/types/reference';

type CityComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: CountryCity[];
  onSuggestionSelect?: (city: CountryCity) => void;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
};

export function CityCombobox({
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  disabled,
  loading,
  autoFocus,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [suggestions, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <TextInput
        value={value}
        onChange={(next) => onChange(toTitleCase(next))}
        placeholder="City"
        disabled={disabled}
        leftIcon={<MapPin size={16} />}
        onFocus={() => setOpen(true)}
        autoFocus={autoFocus}
      />
      {open && !disabled && filtered.length > 0 ? (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-md ring-1 ring-foreground/5'
          )}
        >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandGroup>
                {filtered.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    isChosen={city.name === value}
                    onSelect={() => {
                      onChange(city.name);
                      onSuggestionSelect?.(city);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 font-medium">{city.name}</span>
                    <Check className={cn('ml-1 size-4 shrink-0', city.name === value ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {loading ? <p className="px-3 py-2 text-xs text-muted-foreground">Loading suggestions…</p> : null}
        </div>
      ) : null}
    </div>
  );
}
