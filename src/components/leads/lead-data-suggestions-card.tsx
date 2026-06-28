'use client';

import { useTransition } from 'react';
import { applyLeadFieldSuggestion, dismissLeadFieldSuggestion } from '@/app/(crm)/customers/actions';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { cn } from '@/lib/cn';
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
  if (sources.size === 1 && (sources.has('Meta (LeadSync)') || sources.has('Meta'))) {
    return 'Updates from Meta';
  }
  if (sources.size === 1 && sources.has('Manual entry')) {
    return 'Profile updates';
  }
  return 'Suggested updates';
}

function lockedHint(item: FieldSuggestion): string {
  if (item.field === 'name') {
    return 'Name is locked after registration.';
  }
  if (item.sourceLabel === 'Manual entry') {
    return 'Locked at this stage.';
  }
  return 'Cannot change at this stage.';
}

function subtitleForSuggestions(
  pendingItems: FieldSuggestion[],
  appliedItems: FieldSuggestion[],
  dismissedItems: FieldSuggestion[],
  sourceLabel: string | null
): string {
  const parts: string[] = [];
  if (pendingItems.length > 0) {
    parts.push(`${pendingItems.length} pending`);
  }
  if (appliedItems.length > 0) {
    parts.push(`${appliedItems.length} applied`);
  }
  if (parts.length === 0 && dismissedItems.length > 0) {
    parts.push(`${dismissedItems.length} dismissed`);
  }
  if (sourceLabel) {
    parts.push(sourceLabel);
  }
  return parts.join(' · ');
}

export function LeadDataSuggestionsCard({ leadId, suggestions, onUpdated }: LeadDataSuggestionsCardProps) {
  const [pending, startTransition] = useTransition();

  const externalSuggestions = suggestions.filter((s) => s.source !== 'manual_intake');

  if (externalSuggestions.length === 0) {
    return null;
  }

  const pendingItems = externalSuggestions.filter((s) => s.status === 'pending');
  const appliedItems = externalSuggestions.filter((s) => s.status === 'applied');
  const dismissedItems = externalSuggestions.filter((s) => s.status === 'dismissed');

  if (pendingItems.length === 0 && appliedItems.length === 0 && dismissedItems.length === 0) {
    return null;
  }

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

  const sourceLabel =
    new Set(externalSuggestions.map((s) => s.sourceLabel)).size === 1
      ? (externalSuggestions[0]?.sourceLabel ?? null)
      : null;

  return (
    <Card
      padding="none"
      className={cn(
        'w-full overflow-hidden border-[#B8BEF5] bg-linear-to-br from-[#F7F8FF] via-[#EEF0FF] to-[#E4E7FF] shadow-[0_1px_3px_rgba(92,101,207,0.08)]',
        '[&_tbody_tr]:border-[#C8CCFF]/60 [&_thead_tr]:bg-[#DFE3FF]/80'
      )}
    >
      <div className="border-b border-[#C8CCFF]/70 px-5 py-3.5">
        <SectionHead
          className="mb-0"
          title={sectionTitle(externalSuggestions)}
          subtitle={subtitleForSuggestions(pendingItems, appliedItems, dismissedItems, sourceLabel)}
        />
      </div>

      {pendingItems.length > 0 || appliedItems.length > 0 ? (
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell className="w-24 pl-5">Field</DataTableHeaderCell>
            <DataTableHeaderCell>Previous</DataTableHeaderCell>
            <DataTableHeaderCell>Suggested</DataTableHeaderCell>
            <DataTableHeaderCell className="w-28 pr-5 text-right"> </DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {pendingItems.map((item) => (
              <DataTableRow key={item.id} className={cn(!item.editable && 'opacity-75')}>
                <DataTableCell className="py-2.5 pl-5 text-xs font-bold tracking-wide text-brand-deep uppercase">
                  {FIELD_LABELS[item.field]}
                </DataTableCell>
                <DataTableCell className="py-2.5 text-[13px] text-slate-600">
                  <span className="block truncate">{item.currentValue || '—'}</span>
                </DataTableCell>
                <DataTableCell className="py-2.5 text-[13px] font-semibold text-slate-900">
                  <span className="block truncate">{item.suggestedValue || '—'}</span>
                </DataTableCell>
                <DataTableCell className="py-2.5 pr-5 text-right">
                  {item.editable ? (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleApply(item.id)}
                        className="cursor-pointer rounded-md border-none bg-brand px-2.5 py-1 text-white hover:bg-brand-press disabled:opacity-50"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDismiss(item.id)}
                        className="cursor-pointer border-none bg-transparent p-0 text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500" title={lockedHint(item)}>
                      Locked
                    </span>
                  )}
                </DataTableCell>
              </DataTableRow>
            ))}
            {appliedItems.map((item) => (
              <DataTableRow key={item.id} className="bg-white/30">
                <DataTableCell className="py-2.5 pl-5 text-xs font-bold tracking-wide text-brand-deep uppercase">
                  {FIELD_LABELS[item.field]}
                </DataTableCell>
                <DataTableCell className="py-2.5 text-[13px] text-slate-600">
                  <span className="block truncate">{item.currentValue || '—'}</span>
                </DataTableCell>
                <DataTableCell className="py-2.5 text-[13px] font-semibold text-slate-900">
                  <span className="block truncate">{item.suggestedValue || '—'}</span>
                </DataTableCell>
                <DataTableCell className="py-2.5 pr-5 text-right">
                  <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Applied
                  </span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      ) : null}

      {dismissedItems.length > 0 ? (
        <details className="border-t border-[#C8CCFF]/70 px-5 py-2.5 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">Dismissed ({dismissedItems.length})</summary>
          <ul className="mt-1.5 space-y-0.5">
            {dismissedItems.map((item) => (
              <li key={item.id} className="truncate">
                {FIELD_LABELS[item.field]}: {item.currentValue || '—'} → {item.suggestedValue}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
