'use client';

import { Lock, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Skeleton } from '@/components/loading/skeleton';
import { cn } from '@/lib/cn';
import { filterAndRankBySearch } from '@/lib/search-match';
import { tagSlugToLabel, toTagSlug } from '@/lib/lead-tags';
import type { TagSuggestion } from '@/types/crm';

export function TagChipSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-7 w-20 rounded-full', className)} />;
}

export function TagChip({
  label,
  locked,
  onRemove,
  disabled,
  tone = 'default',
}: {
  label: string;
  locked?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'profile';
}) {
  if (locked) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
          tone === 'profile' ? 'border border-brand/25 bg-brand/12 text-brand-press' : 'bg-slate-100/80 text-slate-600'
        )}
        title="System tag"
      >
        <Lock className={cn('h-3 w-3', tone === 'profile' ? 'text-brand/60' : 'text-slate-400')} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'group inline-flex items-center rounded-full pl-2.5 text-xs font-medium',
        tone === 'profile'
          ? 'border border-brand-press/80 bg-brand text-white'
          : 'border border-slate-200/90 bg-white text-slate-700'
      )}
    >
      {label}
      <button
        type="button"
        className={cn(
          'ml-0.5 rounded-full p-1 transition-colors disabled:opacity-40',
          tone === 'profile'
            ? 'text-white/70 hover:bg-white/15 hover:text-white'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
        )}
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
  skeletonSlugs?: string[];
  saving?: boolean;
  tone?: 'default' | 'profile';
};

export function LeadTagEditor({
  manualTags,
  systemTags = [],
  suggestions,
  onManualTagsChange,
  disabled = false,
  bordered = false,
  onError,
  skeletonSlugs = [],
  saving = false,
  tone = 'default',
}: LeadTagEditorProps) {
  const listboxId = useId();
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const suggestionLabels = useMemo(
    () => new Map(suggestions.map((item) => [item.slug, tagSlugToLabel(item.slug)])),
    [suggestions]
  );
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
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const anchor = rootRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [draft, open]);

  useEffect(() => {
    if (!showMenu) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showMenu, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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
        <TagChip key={`system-${slug}`} label={suggestionLabels.get(slug) ?? tagSlugToLabel(slug)} locked tone={tone} />
      ))}

      {manualTags.map((slug) =>
        skeletonSlugs.includes(slug) ? (
          <TagChipSkeleton key={`manual-skel-${slug}`} />
        ) : (
          <TagChip
            key={`manual-${slug}`}
            label={suggestionLabels.get(slug) ?? tagSlugToLabel(slug)}
            onRemove={() => removeTag(slug)}
            disabled={disabled}
            tone={tone}
          />
        )
      )}

      <div ref={rootRef} className="relative inline-block w-28 shrink-0 sm:w-32">
        {saving ? (
          <TagChipSkeleton className="w-28 sm:w-32" />
        ) : (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 transition-colors',
              tone === 'profile'
                ? 'border-brand/35 bg-brand/5 focus-within:border-brand/50 focus-within:bg-brand/8'
                : 'border-slate-200 focus-within:border-brand/35 focus-within:bg-brand/3',
              showMenu && (tone === 'profile' ? 'border-brand/50 bg-brand/8' : 'border-brand/35 bg-brand/3'),
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
        )}

        {showMenu && menuPosition && mounted
          ? createPortal(
              <div
                ref={menuRef}
                id={listboxId}
                role="listbox"
                style={{
                  position: 'fixed',
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                  zIndex: 200,
                }}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white py-0.5 shadow-md"
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
                    {tagSlugToLabel(item.slug)}
                  </button>
                ))}
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  );
}
