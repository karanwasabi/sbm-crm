'use client';

import { useTransition } from 'react';
import { applyLeadFieldSuggestion, dismissLeadFieldSuggestion } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { FieldSuggestion } from '@/types/crm';

type LeadDataSuggestionsCardProps = {
  leadId: string;
  suggestions: FieldSuggestion[];
  onUpdated: () => void;
};

const FIELD_LABELS: Record<FieldSuggestion['field'], string> = {
  name: 'Name',
  phone: 'Phone',
  city: 'City',
  country: 'Country',
};

function sectionTitle(suggestions: FieldSuggestion[]) {
  const sources = new Set(suggestions.map((s) => s.sourceLabel));
  if (sources.size === 1 && sources.has('Meta (LeadSync)')) {
    return 'Updates from Meta';
  }
  if (sources.size === 1 && sources.has('Meta')) {
    return 'Updates from Meta';
  }
  return 'Suggested updates';
}

export function LeadDataSuggestionsCard({ leadId, suggestions, onUpdated }: LeadDataSuggestionsCardProps) {
  const [pending, startTransition] = useTransition();

  if (suggestions.length === 0) {
    return null;
  }

  const pendingItems = suggestions.filter((s) => s.status === 'pending');
  const dismissedItems = suggestions.filter((s) => s.status === 'dismissed');

  const handleApply = (suggestionId: number) => {
    startTransition(async () => {
      const result = await applyLeadFieldSuggestion(leadId, suggestionId);
      if (!result.error) {
        onUpdated();
      }
    });
  };

  const handleDismiss = (suggestionId: number) => {
    startTransition(async () => {
      const result = await dismissLeadFieldSuggestion(leadId, suggestionId);
      if (!result.error) {
        onUpdated();
      }
    });
  };

  return (
    <Card>
      <SectionHead title={sectionTitle(suggestions)} subtitle="Compare inbound data with the profile on file" />
      <div className="mt-3 flex flex-col gap-3">
        {pendingItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                {FIELD_LABELS[item.field]}
              </span>
              <span className="text-xs text-slate-500">{item.sourceLabel}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Current</p>
                <p className="font-semibold text-slate-800">{item.currentValue || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">Suggested</p>
                <p className="font-semibold text-slate-800">{item.suggestedValue || '—'}</p>
              </div>
            </div>
            {!item.editable ? (
              <p className="mt-2 text-xs text-slate-600">
                {item.field === 'name'
                  ? 'Meta reported a different name—we keep the profile name they registered with.'
                  : 'This value differs from what we have on file and cannot be changed at this stage.'}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" disabled={pending} onClick={() => handleApply(item.id)}>
                  Apply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => handleDismiss(item.id)}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
        {dismissedItems.length > 0 ? (
          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700">
              Dismissed suggestions ({dismissedItems.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-1">
              {dismissedItems.map((item) => (
                <li key={item.id}>
                  {FIELD_LABELS[item.field]}: {item.suggestedValue} ({item.sourceLabel})
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </Card>
  );
}
