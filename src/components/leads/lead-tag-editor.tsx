'use client';

import { Lock, Plus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { filterAndRankBySearch } from '@/lib/search-match';
import { tagSlugToLabel, toTagSlug } from '@/lib/lead-tags';
import type { TagSuggestion } from '@/types/crm';

export function TagChip({
  label,
  locked,
  onRemove,
  disabled,
}: {
  label: string;
  locked?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600"
        title="System tag"
      >
        <Lock className="h-3 w-3 text-slate-400" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span className="group inline-flex items-center rounded-full border border-slate-200/90 bg-white pl-2.5 text-xs font-medium text-slate-700">
      {label}
      <button
        type="button"
        className="ml-0.5 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

type LeadTagEditorProps = {
  manualTags: string[];
  systemTags?: string[];
  suggestions: TagSuggestion[];
  onManualTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  bordered?: boolean;
  onError?: (message: string | null) => void;
};

export function LeadTagEditor({
  manualTags,
  systemTags = [],
  suggestions,
  onManualTagsChange,
  disabled = false,
  bordered = false,
  onError,
}: LeadTagEditorProps) {
  const listboxId = useId();
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestionLabels = useMemo(() => new Map(suggestions.map((item) => [item.slug, item.label])), [suggestions]);
  const allTags = useMemo(() => [...systemTags, ...manualTags], [systemTags, manualTags]);

  const availableSuggestions = useMemo(
    () => suggestions.filter((item) => !allTags.includes(item.slug)),
    [suggestions, allTags]
  );

  const filteredSuggestions = useMemo(() => {
    const ranked = filterAndRankBySearch(availableSuggestions, draft, (item) => `${item.label} ${item.slug}`);
    if (draft.trim()) return ranked.slice(0, 6);
    return availableSuggestions.slice(0, 6);
  }, [availableSuggestions, draft]);

  const showMenu = open && !disabled && filteredSuggestions.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [draft, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const addTagBySlug = (slug: string) => {
    if (allTags.includes(slug)) {
      onError?.('Tag already exists.');
      return;
    }
    onError?.(null);
    onManualTagsChange([...manualTags, slug]);
    setDraft('');
    setOpen(false);
  };

  const addTagFromInput = () => {
    const slug = toTagSlug(draft);
    if (!slug) {
      onError?.('Enter a valid tag.');
      return;
    }
    addTagBySlug(slug);
  };

  const removeTag = (slug: string) => {
    onManualTagsChange(manualTags.filter((item) => item !== slug));
    onError?.(null);
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5',
        bordered &&
          'min-h-11 rounded-[14px] border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20'
      )}
    >
      {systemTags.map((slug) => (
        <TagChip key={`system-${slug}`} label={suggestionLabels.get(slug) ?? tagSlugToLabel(slug)} locked />
      ))}

      {manualTags.map((slug) => (
        <TagChip
          key={`manual-${slug}`}
          label={suggestionLabels.get(slug) ?? tagSlugToLabel(slug)}
          onRemove={() => removeTag(slug)}
          disabled={disabled}
        />
      ))}

      <div ref={rootRef} className="relative inline-block w-28 shrink-0 sm:w-32">
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border border-dashed border-slate-200 px-2.5 py-1 transition-colors',
            'focus-within:border-brand/35 focus-within:bg-brand/3',
            showMenu && 'border-brand/35 bg-brand/3',
            disabled && 'opacity-50'
          )}
        >
          <Plus className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
              onError?.(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (filteredSuggestions.length > 0) {
                  setOpen(true);
                  setActiveIndex((index) => (index + 1) % filteredSuggestions.length);
                }
                return;
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (filteredSuggestions.length > 0) {
                  setOpen(true);
                  setActiveIndex((index) => (index - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                }
                return;
              }
              if (event.key === 'Escape') {
                setOpen(false);
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                if (showMenu && filteredSuggestions[activeIndex]) {
                  addTagBySlug(filteredSuggestions[activeIndex].slug);
                  return;
                }
                addTagFromInput();
              }
            }}
            placeholder="Add tag…"
            disabled={disabled}
            role="combobox"
            aria-expanded={showMenu}
            aria-autocomplete="list"
            aria-controls={listboxId}
            className="w-full min-w-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {showMenu ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute top-[calc(100%+0.25rem)] left-0 z-80 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white py-0.5 shadow-md sm:w-32"
          >
            {filteredSuggestions.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'block w-full truncate px-2.5 py-1.5 text-left text-xs whitespace-nowrap transition-colors',
                  index === activeIndex ? 'bg-brand/8 font-medium text-brand' : 'text-slate-700 hover:bg-slate-50'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTagBySlug(item.slug)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
