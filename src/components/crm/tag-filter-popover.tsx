'use client';

import { Tag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { TagFilterMode, TagSuggestion } from '@/types/crm';

type TagFilterPopoverProps = {
  filters: LeadDatabaseFilters;
  suggestions: TagSuggestion[];
};

export function TagFilterPopover({ filters, suggestions }: TagFilterPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(filters.tags);
  const [draftMode, setDraftMode] = useState<TagFilterMode>(filters.tagMode);

  const suggestionMap = useMemo(() => new Map(suggestions.map((item) => [item.slug, item])), [suggestions]);

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { tags: draftTags, tagMode: draftMode }));
    setOpen(false);
  };

  const clear = () => {
    setDraftTags([]);
    setDraftMode('and');
    router.push(buildLeadDatabaseHref(filters, { tags: [], tagMode: 'and' }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftTags(filters.tags);
          setDraftMode(filters.tagMode);
        }
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(filters.tags.length > 0)}>
        <Tag className="h-3.5 w-3.5" />
        Tags{filters.tags.length > 0 ? ` (${filters.tags.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by tags</p>
        <p className="mt-1 text-xs text-slate-500">Select one or more tags.</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              draftMode === 'and' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setDraftMode('and')}
          >
            Match all (AND)
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              draftMode === 'or' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setDraftMode('or')}
          >
            Match any (OR)
          </button>
        </div>

        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {suggestions.map((item) => {
            const selected = draftTags.includes(item.slug);
            return (
              <button
                key={item.slug}
                type="button"
                className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                  selected ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() =>
                  setDraftTags((current) =>
                    selected ? current.filter((slug) => slug !== item.slug) : [...current, item.slug]
                  )
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {draftTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {draftTags.map((slug) => (
              <Pill key={slug} tone="brand">
                {suggestionMap.get(slug)?.label ?? tagSlugToLabel(slug)}
              </Pill>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {filters.tags.length > 0 || draftTags.length > 0 ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
