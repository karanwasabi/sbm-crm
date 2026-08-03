'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { updateLeadTagsAction } from '@/app/(crm)/customers/actions';
import { LeadTagEditor } from '@/components/leads/lead-tag-editor';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { LeadDetail, TagSuggestion } from '@/types/crm';

type LeadTagsCardProps = {
  lead: LeadDetail;
  suggestions: TagSuggestion[];
  embedded?: boolean;
  readOnly?: boolean;
};

export function LeadTagsCard({ lead, suggestions, embedded = false, readOnly = false }: LeadTagsCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticManualTags, setOptimisticManualTags] = useState<string[] | null>(null);

  const systemTags = useMemo(() => lead.systemTags, [lead.systemTags]);
  const displayManualTags = optimisticManualTags ?? lead.manualTags;

  const pendingAddSlugs = useMemo(() => {
    if (!pending || !optimisticManualTags) return [];
    return optimisticManualTags.filter((slug) => !lead.manualTags.includes(slug));
  }, [pending, optimisticManualTags, lead.manualTags]);

  useEffect(() => {
    if (optimisticManualTags && !pending) {
      setOptimisticManualTags(null);
    }
  }, [lead.manualTags, optimisticManualTags, pending]);

  const persistTags = (nextManualTags: string[], successMessage: string) => {
    setOptimisticManualTags(nextManualTags);
    startTransition(async () => {
      const result = await updateLeadTagsAction(lead.id, nextManualTags);
      if (result.error) {
        setOptimisticManualTags(null);
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }
      setError(null);
      toast({ message: successMessage, variant: 'success' });
      router.refresh();
    });
  };

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Tags</p>
        <div className="min-w-0 flex-1">
          <LeadTagEditor
            systemTags={systemTags}
            manualTags={displayManualTags}
            suggestions={suggestions}
            disabled={readOnly || pending}
            saving={pending && pendingAddSlugs.length > 0}
            skeletonSlugs={pendingAddSlugs}
            tone={embedded ? 'profile' : 'default'}
            onError={setError}
            onManualTagsChange={(next) => {
              const added = next.length > lead.manualTags.length;
              persistTags(next, added ? 'Tag added' : 'Tag removed');
            }}
          />
        </div>
      </div>

      {error ? <p className="mt-2 text-[11px] text-danger-press">{error}</p> : null}
    </>
  );

  if (embedded) {
    return (
      <div className="overflow-visible rounded-b-[22px] bg-linear-to-b from-white via-[#FAFAFA] to-[#F5F5F5] px-4 py-3 sm:px-5">
        {content}
      </div>
    );
  }

  return (
    <Card padding="sm" className="overflow-visible border-slate-100/80 shadow-none">
      {content}
    </Card>
  );
}
