'use client';

import { Tag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { buildLeadDatabaseHref } from '@/lib/lead-database-url';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { TagFilterMode, TagSuggestion } from '@/types/crm';

type TagFilterPopoverProps = {
  activeStage: string;
  activeMarketingStatus: string;
  activeTags: string[];
  activeTagMode: TagFilterMode;
  suggestions: TagSuggestion[];
};

export function TagFilterPopover({
  activeStage,
  activeMarketingStatus,
  activeTags,
  activeTagMode,
  suggestions,
}: TagFilterPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(activeTags);
  const [draftMode, setDraftMode] = useState<TagFilterMode>(activeTagMode);

  const suggestionMap = useMemo(() => new Map(suggestions.map((item) => [item.slug, item])), [suggestions]);

  const apply = () => {
    router.push(buildLeadDatabaseHref(activeStage, activeMarketingStatus, draftTags, draftMode));
    setOpen(false);
  };

  const clear = () => {
    setDraftTags([]);
    setDraftMode('and');
    router.push(buildLeadDatabaseHref(activeStage, activeMarketingStatus, [], 'and'));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftTags(activeTags);
          setDraftMode(activeTagMode);
        }
      }}
    >
      <PopoverTrigger
        type="button"
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 border-x-0 border-t-0 border-b-[3px] font-semibold transition-all duration-100 outline-none',
          'rounded-2xl px-4 py-2.25 text-xs',
          activeTags.length > 0
            ? 'border-b-brand-press bg-brand text-white shadow-brand'
            : 'border-b-slate-200 bg-white text-brand shadow-sm'
        )}
      >
        <Tag className="h-3.5 w-3.5" />
        Tags{activeTags.length > 0 ? ` (${activeTags.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by tags</p>
        <p className="mt-1 text-xs text-slate-500">Select one or more tags. Slugs are stored in the URL.</p>

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
        <p className="mt-2 text-[11px] text-slate-500">
          {draftMode === 'and' ? 'Must have all selected tags.' : 'Has any selected tag.'}
        </p>

        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {suggestions.map((item) => {
            const selected = draftTags.includes(item.slug);
            return (
              <button
                key={item.slug}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                  selected ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() =>
                  setDraftTags((current) =>
                    selected ? current.filter((slug) => slug !== item.slug) : [...current, item.slug]
                  )
                }
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400">{item.slug}</span>
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
          {activeTags.length > 0 || draftTags.length > 0 ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
