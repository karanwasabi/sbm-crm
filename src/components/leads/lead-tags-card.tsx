'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { updateLeadTagsAction } from '@/app/(crm)/customers/actions';
import { LeadTagEditor } from '@/components/leads/lead-tag-editor';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { LeadDetail, TagSuggestion } from '@/types/crm';

type LeadTagsCardProps = {
  lead: LeadDetail;
  suggestions: TagSuggestion[];
};

export function LeadTagsCard({ lead, suggestions }: LeadTagsCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const systemTags = useMemo(() => lead.systemTags, [lead.systemTags]);

  const persistTags = (nextManualTags: string[], successMessage: string) => {
    startTransition(async () => {
      const result = await updateLeadTagsAction(lead.id, nextManualTags);
      if (result.error) {
        setError(result.error);
        toast({ message: result.error, variant: 'error' });
        return;
      }
      setError(null);
      toast({ message: successMessage, variant: 'success' });
      router.refresh();
    });
  };

  return (
    <Card padding="sm" className="overflow-visible border-slate-100/80 shadow-none">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Tags</p>

      <LeadTagEditor
        systemTags={systemTags}
        manualTags={lead.manualTags}
        suggestions={suggestions}
        disabled={pending}
        onError={setError}
        onManualTagsChange={(next) => {
          const added = next.length > lead.manualTags.length;
          persistTags(next, added ? 'Tag added' : 'Tag removed');
        }}
      />

      {error ? <p className="mt-2 text-[11px] text-danger-press">{error}</p> : null}
    </Card>
  );
}
