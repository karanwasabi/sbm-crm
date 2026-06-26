'use client';

import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { updateLeadTagsAction } from '@/app/(crm)/customers/actions';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { tagSlugToLabel, toTagSlug } from '@/lib/lead-tags';
import type { LeadDetail, TagSuggestion } from '@/types/crm';

type LeadTagsCardProps = {
  lead: LeadDetail;
  suggestions: TagSuggestion[];
};

export function LeadTagsCard({ lead, suggestions }: LeadTagsCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const suggestionLabels = useMemo(() => new Map(suggestions.map((item) => [item.slug, item.label])), [suggestions]);

  const addTag = () => {
    const slug = toTagSlug(draft);
    if (!slug) {
      setError('Enter a valid tag.');
      return;
    }
    if (lead.tags.includes(slug)) {
      setError('Tag already exists.');
      return;
    }

    setError(null);
    const next = [...lead.manualTags, slug];
    startTransition(async () => {
      const result = await updateLeadTagsAction(lead.id, next);
      if (result.error) {
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }
      setDraft('');
      toast({ message: 'Tags updated', variant: 'success' });
      router.refresh();
    });
  };

  const removeTag = (slug: string) => {
    const next = lead.manualTags.filter((item) => item !== slug);
    startTransition(async () => {
      const result = await updateLeadTagsAction(lead.id, next);
      if (result.error) {
        toast({ message: result.error, variant: 'error' });
        return;
      }
      toast({ message: 'Tag removed', variant: 'success' });
      router.refresh();
    });
  };

  return (
    <Card>
      <SectionHead title="Tags" subtitle="System tags are automatic; staff can add manual tags." />
      <Eyebrow className="mt-3 mb-2">System</Eyebrow>
      <div className="flex flex-wrap gap-1.5">
        {lead.systemTags.length === 0 ? (
          <span className="text-sm text-slate-400">No system tags</span>
        ) : (
          lead.systemTags.map((slug) => (
            <Pill key={slug} tone="neutral">
              {suggestionLabels.get(slug) ?? tagSlugToLabel(slug)}
            </Pill>
          ))
        )}
      </div>

      <Eyebrow className="mt-4 mb-2">Manual</Eyebrow>
      <div className="flex flex-wrap gap-1.5">
        {lead.manualTags.map((slug) => (
          <button
            key={slug}
            type="button"
            className="group inline-flex items-center gap-1"
            onClick={() => removeTag(slug)}
            disabled={pending}
            title="Remove tag"
          >
            <Pill tone="brand">
              {suggestionLabels.get(slug) ?? tagSlugToLabel(slug)}
              <X className="ml-1 h-3 w-3 opacity-60 group-hover:opacity-100" />
            </Pill>
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <TextInput
          value={draft}
          onChange={setDraft}
          placeholder="Add tag (e.g. VIP, Summer cohort)"
          disabled={pending}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-brand hover:bg-slate-50 disabled:opacity-50"
          onClick={addTag}
          disabled={pending || !draft.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-danger-press">{error}</p> : null}
    </Card>
  );
}
