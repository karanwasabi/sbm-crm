'use client';

import { Search, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { tagSlugToLabel } from '@/lib/lead-tags';
import { cn } from '@/lib/cn';
import type { TagFilterMode, TagSuggestion } from '@/types/crm';

type TagFilterSheetProps = {
  filters: LeadDatabaseFilters;
  suggestions: TagSuggestion[];
};

function filterSuggestions(suggestions: TagSuggestion[], query: string): TagSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return suggestions;
  return suggestions.filter(
    (item) => item.label.toLowerCase().includes(normalized) || item.slug.toLowerCase().includes(normalized)
  );
}

type TagSectionProps = {
  title: string;
  description: string;
  suggestions: TagSuggestion[];
  selected: string[];
  onToggle: (slug: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClear: () => void;
  modeControls?: React.ReactNode;
};

function TagSection({
  title,
  description,
  suggestions,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  modeControls,
}: TagSectionProps) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      {modeControls}
      <div className="flex items-center gap-3 text-xs font-semibold">
        <button
          type="button"
          className="text-brand hover:text-brand-press disabled:text-slate-300"
          disabled={suggestions.length === 0}
          onClick={onSelectAll}
        >
          Select all
        </button>
        <span className="text-slate-300">·</span>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-700 disabled:text-slate-300"
          disabled={selected.length === 0}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
        {suggestions.length === 0 ? (
          <p className="px-2 py-3 text-xs text-slate-500">No tags match your search.</p>
        ) : (
          suggestions.map((item) => (
            <Checkbox
              key={item.slug}
              checked={selected.includes(item.slug)}
              onChange={(checked) => onToggle(item.slug, checked)}
              label={item.label}
              className="rounded-lg px-2 py-1.5 hover:bg-white"
            />
          ))
        )}
      </div>
    </section>
  );
}

export function TagFilterSheet({ filters, suggestions }: TagFilterSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(filters.tags);
  const [draftExcludeTags, setDraftExcludeTags] = useState<string[]>(filters.excludeTags);
  const [draftMode, setDraftMode] = useState<TagFilterMode>(filters.tagMode);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleSuggestions = useMemo(() => filterSuggestions(suggestions, searchQuery), [suggestions, searchQuery]);
  const visibleSlugs = useMemo(() => visibleSuggestions.map((item) => item.slug), [visibleSuggestions]);

  const tagFilterActive = filters.tags.length > 0 || filters.excludeTags.length > 0;
  const tagFilterCount = filters.tags.length + filters.excludeTags.length;

  const resetDraftFromFilters = () => {
    setDraftTags(filters.tags);
    setDraftExcludeTags(filters.excludeTags);
    setDraftMode(filters.tagMode);
    setSearchQuery('');
  };

  const apply = () => {
    router.push(
      buildLeadDatabaseHref(filters, {
        tags: draftTags,
        excludeTags: draftExcludeTags,
        tagMode: draftMode,
      })
    );
    setOpen(false);
  };

  const clearAll = () => {
    setDraftTags([]);
    setDraftExcludeTags([]);
    setDraftMode('and');
    router.push(
      buildLeadDatabaseHref(filters, {
        tags: [],
        excludeTags: [],
        tagMode: 'and',
      })
    );
    setOpen(false);
  };

  const toggleInclude = (slug: string, checked: boolean) => {
    setDraftTags((current) => (checked ? [...current, slug] : current.filter((item) => item !== slug)));
    if (checked) {
      setDraftExcludeTags((current) => current.filter((item) => item !== slug));
    }
  };

  const toggleExclude = (slug: string, checked: boolean) => {
    setDraftExcludeTags((current) => (checked ? [...current, slug] : current.filter((item) => item !== slug)));
    if (checked) {
      setDraftTags((current) => current.filter((item) => item !== slug));
    }
  };

  const selectAllInclude = () => {
    setDraftTags((current) => Array.from(new Set([...current, ...visibleSlugs])));
    setDraftExcludeTags((current) => current.filter((slug) => !visibleSlugs.includes(slug)));
  };

  const selectAllExclude = () => {
    setDraftExcludeTags((current) => Array.from(new Set([...current, ...visibleSlugs])));
    setDraftTags((current) => current.filter((slug) => !visibleSlugs.includes(slug)));
  };

  const hasDraft =
    draftTags.length > 0 ||
    draftExcludeTags.length > 0 ||
    draftTags.join(',') !== filters.tags.join(',') ||
    draftExcludeTags.join(',') !== filters.excludeTags.join(',') ||
    draftMode !== filters.tagMode;

  const summaryParts: string[] = [];
  if (draftTags.length > 0) {
    const labels = draftTags.map((slug) => tagSlugToLabel(slug)).join(', ');
    summaryParts.push(`Must have ${draftMode === 'or' ? 'any of' : 'all of'}: ${labels}`);
  }
  if (draftExcludeTags.length > 0) {
    const labels = draftExcludeTags.map((slug) => tagSlugToLabel(slug)).join(', ');
    summaryParts.push(`Must not have: ${labels}`);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetDraftFromFilters();
      }}
    >
      <SheetTrigger type="button" className={filterPopoverTriggerClass(tagFilterActive)}>
        <Tag className="h-3.5 w-3.5" />
        Tags{tagFilterActive ? ` (${tagFilterCount})` : ''}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tag filters</SheetTitle>
          <SheetDescription>Narrow leads by tags they must or must not have.</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tags…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <TagSection
            title="Must have"
            description="Leads must match these tags."
            suggestions={visibleSuggestions}
            selected={draftTags}
            onToggle={toggleInclude}
            onSelectAll={selectAllInclude}
            onClear={() => setDraftTags([])}
            modeControls={
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    draftMode === 'and' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                  )}
                  onClick={() => setDraftMode('and')}
                >
                  Match all (AND)
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    draftMode === 'or' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                  )}
                  onClick={() => setDraftMode('or')}
                >
                  Match any (OR)
                </button>
              </div>
            }
          />

          <TagSection
            title="Must not have"
            description="Leads with any of these tags are hidden."
            suggestions={visibleSuggestions}
            selected={draftExcludeTags}
            onToggle={toggleExclude}
            onSelectAll={selectAllExclude}
            onClear={() => setDraftExcludeTags([])}
          />

          {summaryParts.length > 0 ? (
            <div className="rounded-xl border border-brand/15 bg-brand/5 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
              {summaryParts.map((part) => (
                <p key={part}>{part}</p>
              ))}
            </div>
          ) : null}
        </SheetBody>

        <SheetFooter className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {tagFilterActive || hasDraft ? (
            <Button variant="light" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
