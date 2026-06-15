'use client';

import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterAndRankBySearch } from '@/lib/search-match';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Label shown in the trigger when selected. Defaults to label. */
  triggerLabel?: string;
  /** Text used for search ranking. Defaults to label only. */
  searchText?: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Prominent label on the right (e.g. UTC offset). */
  rightLabel?: ReactNode;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  className?: string;
  popoverClassName?: string;
  searchable?: boolean;
  /** When true, scrolls the selected option into view on open (before searching). */
  scrollToSelectedOnOpen?: boolean;
  /** When true, focuses the search field when the dropdown opens. */
  focusSearchOnOpen?: boolean;
  autoFocus?: boolean;
  focusRef?: RefObject<HTMLButtonElement | null>;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  disabled,
  leftIcon,
  className,
  popoverClassName,
  searchable = true,
  scrollToSelectedOnOpen = false,
  focusSearchOnOpen = true,
  autoFocus = false,
  focusRef,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (focusRef) focusRef.current = node;
  };

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const triggerIcon = selected?.icon ?? leftIcon;
  const triggerLabel = selected?.triggerLabel ?? selected?.label;

  const visibleOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    return filterAndRankBySearch(options, search, (option) => option.searchText ?? option.label);
  }, [options, search, searchable]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open || !searchable || !focusSearchOnOpen) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, searchable, focusSearchOnOpen]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const focus = () => triggerRef.current?.focus();
    const frame = requestAnimationFrame(focus);
    const timer = window.setTimeout(focus, 50);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (!open) return;
    if (search.trim()) {
      listRef.current?.scrollTo({ top: 0 });
      return;
    }
    if (!scrollToSelectedOnOpen || !value) return;
    const scrollSelected = () => selectedItemRef.current?.scrollIntoView({ block: 'center' });
    const frame = requestAnimationFrame(scrollSelected);
    const timer = window.setTimeout(scrollSelected, 50);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open, search, scrollToSelectedOnOpen, value, visibleOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={setTriggerRef}
        type="button"
        disabled={disabled}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-background px-3.5 text-sm font-medium shadow-none transition-colors outline-none',
          'hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {triggerIcon ? <span className="shrink-0 text-muted-foreground">{triggerIcon}</span> : null}
          <span className="truncate">{triggerLabel ?? placeholder}</span>
        </span>
        {selected?.rightLabel && !selected?.triggerLabel ? (
          <span className="ml-2 shrink-0 text-sm font-semibold text-primary tabular-nums">{selected.rightLabel}</span>
        ) : null}
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className={cn('w-(--anchor-width) p-0', popoverClassName)} align="start">
        <Command shouldFilter={false}>
          {searchable ? (
            <CommandInput ref={searchRef} placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          ) : null}
          <CommandList ref={listRef}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {visibleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  ref={option.value === value ? selectedItemRef : undefined}
                  value={option.value}
                  isChosen={option.value === value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.icon ? <span className="shrink-0">{option.icon}</span> : null}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.subtitle ? <div className="text-xs text-muted-foreground">{option.subtitle}</div> : null}
                  </div>
                  {option.rightLabel ? (
                    <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                      {option.rightLabel}
                    </span>
                  ) : null}
                  <Check className={cn('ml-1 size-4 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
