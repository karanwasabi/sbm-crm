'use client';

import { useMemo, useTransition } from 'react';
import {
  applyLeadFieldSuggestion,
  applyManualIntakeSnapshot,
  applyManualIntakeSubmitted,
} from '@/app/(crm)/customers/actions';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { formatActivityTimestamp } from '@/lib/datetime-display';
import { useDisplayTimezone } from '@/hooks/use-display-timezone';
import { cn } from '@/lib/cn';
import type { FieldSuggestion, LifecycleStage, ManualIntakeRecord } from '@/types/crm';

export type LeadProfileSnapshot = {
  name: string;
  phone: string;
  city: string;
  countryCode: string;
  stage: LifecycleStage;
};

type ManualIntakeRecordsCardProps = {
  leadId: string;
  profile: LeadProfileSnapshot;
  records: ManualIntakeRecord[];
  suggestions: FieldSuggestion[];
  onUpdated: () => void;
};

type CompareField = FieldSuggestion['field'];

type MatrixRow = {
  label: string;
  field: CompareField | null;
  original: string;
  inquiries: string[];
};

function modeLabel(mode: ManualIntakeRecord['mode']): string {
  return mode === 'profile' ? 'Merged into profile' : 'Inquiry linked';
}

function normalizeFieldValue(field: CompareField, value: string): string {
  const trimmed = value.trim();
  if (field === 'country') {
    return trimmed.toUpperCase();
  }
  return trimmed.toLowerCase();
}

function fieldValuesEqual(field: CompareField, a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) {
    return false;
  }
  return normalizeFieldValue(field, a) === normalizeFieldValue(field, b);
}

function currentProfileValue(profile: LeadProfileSnapshot, field: CompareField): string {
  switch (field) {
    case 'name':
      return profile.name;
    case 'phone':
      return profile.phone;
    case 'city':
      return profile.city;
    case 'country':
      return profile.countryCode;
  }
}

function fieldEditableAtStage(stage: LifecycleStage, field: CompareField): boolean {
  if (field === 'name') {
    return stage === 'inquiry' || stage === 'engaged' || stage === 'lost';
  }
  if (stage === 'inquiry' || stage === 'engaged' || stage === 'lost') {
    return true;
  }
  if (stage === 'registered') {
    return field === 'city' || field === 'country';
  }
  return false;
}

function originalBaseline(first: ManualIntakeRecord) {
  return {
    name: first.profileName ?? '',
    email: first.profileEmail ?? '',
    phone: first.profilePhone ?? '',
    city: first.profileCity ?? '',
    country: first.profileCountry ?? '',
  };
}

function inquirySubmitted(record: ManualIntakeRecord, field: CompareField | 'email'): string {
  switch (field) {
    case 'name':
      return record.nameEntered ?? '';
    case 'email':
      return record.emailEntered ?? '';
    case 'phone':
      return record.phoneEntered ?? '';
    case 'city':
      return record.cityEntered ?? '';
    case 'country':
      return record.countryEntered ?? '';
  }
}

function buildMatrixRows(first: ManualIntakeRecord, inquiries: ManualIntakeRecord[]): MatrixRow[] {
  const baseline = originalBaseline(first);
  const rows: MatrixRow[] = [
    {
      label: 'Name',
      field: 'name',
      original: baseline.name,
      inquiries: inquiries.map((r) => inquirySubmitted(r, 'name')),
    },
    {
      label: 'Email',
      field: null,
      original: baseline.email,
      inquiries: inquiries.map((r) => inquirySubmitted(r, 'email')),
    },
    {
      label: 'Phone',
      field: 'phone',
      original: baseline.phone,
      inquiries: inquiries.map((r) => inquirySubmitted(r, 'phone')),
    },
    {
      label: 'City',
      field: 'city',
      original: baseline.city,
      inquiries: inquiries.map((r) => inquirySubmitted(r, 'city')),
    },
    {
      label: 'Country',
      field: 'country',
      original: baseline.country,
      inquiries: inquiries.map((r) => inquirySubmitted(r, 'country')),
    },
  ];
  return rows.filter((row) => row.original || row.inquiries.some((value) => value.trim() !== ''));
}

function ActiveBadge() {
  return (
    <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
      Active
    </span>
  );
}

function ApplyButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-md border-none bg-brand px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-brand-press disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function ValueCell({
  value,
  field,
  profile,
  suggestion,
  pending,
  editableOverride,
  onUse,
}: {
  value: string;
  field: CompareField;
  profile: LeadProfileSnapshot;
  suggestion?: FieldSuggestion;
  pending: boolean;
  editableOverride?: boolean;
  onUse: () => void;
}) {
  const display = value.trim() || '—';
  const current = currentProfileValue(profile, field);
  const isActive = fieldValuesEqual(field, current, value);
  const editable = editableOverride ?? (fieldEditableAtStage(profile.stage, field) && (suggestion?.editable ?? true));
  const dismissed = suggestion?.status === 'dismissed';

  if (!value.trim()) {
    return <span className="text-slate-400">{display}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn(isActive ? 'font-semibold text-slate-900' : 'text-slate-700')}>{display}</span>
      {isActive ? (
        <ActiveBadge />
      ) : editable && !dismissed ? (
        <ApplyButton label="Use" disabled={pending} onClick={onUse} />
      ) : dismissed ? (
        <span className="text-[10px] text-slate-400">Dismissed</span>
      ) : (
        <span className="text-[10px] text-slate-400">Locked</span>
      )}
    </div>
  );
}

function InquiryFootnote({ record, index, timezone }: { record: ManualIntakeRecord; index: number; timezone: string }) {
  const extras = [
    record.emailEntered ? { label: 'Email', value: record.emailEntered } : null,
    record.tagsAdded?.length ? { label: 'Tags', value: record.tagsAdded.join(', ') } : null,
    record.profileFieldsUpdated?.length
      ? { label: 'Profile updated', value: record.profileFieldsUpdated.join(', ') }
      : null,
    record.staffNotes ? { label: 'Staff notes', value: record.staffNotes } : null,
  ].filter((row): row is { label: string; value: string } => row != null);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <p className="text-[12px] font-bold text-slate-800">
        Inquiry {index + 1} · {record.sourceLabel}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        {modeLabel(record.mode)} · {formatActivityTimestamp(record.recordedAt, timezone)}
      </p>
      {extras.length > 0 ? (
        <dl className="mt-2 flex flex-col gap-1">
          {extras.map((item) => (
            <div key={item.label} className="grid grid-cols-[6.5rem_1fr] gap-2 text-[11.5px]">
              <dt className="font-semibold text-slate-500">{item.label}</dt>
              <dd className="text-slate-700">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function ManualIntakeRecordsCard({
  leadId,
  profile,
  records,
  suggestions,
  onUpdated,
}: ManualIntakeRecordsCardProps) {
  const [pending, startTransition] = useTransition();
  const displayTimezone = useDisplayTimezone();

  const manualSuggestions = useMemo(() => suggestions.filter((s) => s.source === 'manual_intake'), [suggestions]);

  const chronologicalRecords = useMemo(
    () => [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [records]
  );

  const suggestionsByEvent = useMemo(() => {
    const linked = new Map<number, Map<CompareField, FieldSuggestion>>();
    const orphaned: FieldSuggestion[] = [];
    for (const item of manualSuggestions) {
      if (item.contactEventId != null) {
        const byField = linked.get(item.contactEventId) ?? new Map<CompareField, FieldSuggestion>();
        byField.set(item.field, item);
        linked.set(item.contactEventId, byField);
      } else {
        orphaned.push(item);
      }
    }
    return { linked, orphaned };
  }, [manualSuggestions]);

  const matrixRows = useMemo(() => {
    if (chronologicalRecords.length === 0) {
      return [];
    }
    return buildMatrixRows(chronologicalRecords[0], chronologicalRecords);
  }, [chronologicalRecords]);

  const baselineEventId = chronologicalRecords[0]?.id;

  if (records.length === 0) {
    return null;
  }

  const suggestionFor = (record: ManualIntakeRecord, index: number, field: CompareField) => {
    const linked = suggestionsByEvent.linked.get(record.id)?.get(field);
    if (linked) {
      return linked;
    }
    if (index === 0 && suggestionsByEvent.orphaned.length > 0) {
      return suggestionsByEvent.orphaned.find((s) => s.field === field);
    }
    return undefined;
  };

  const handleApplyOriginal = (field: CompareField) => {
    if (baselineEventId == null) {
      return;
    }
    startTransition(async () => {
      const result = await applyManualIntakeSnapshot(leadId, baselineEventId, field);
      if (!result.error) {
        onUpdated();
      }
    });
  };

  const handleApplyInquiry = (eventId: number, field: CompareField, suggestion?: FieldSuggestion) => {
    startTransition(async () => {
      const result =
        suggestion && suggestion.status !== 'dismissed'
          ? await applyLeadFieldSuggestion(leadId, suggestion.id)
          : await applyManualIntakeSubmitted(leadId, eventId, field);
      if (!result.error) {
        onUpdated();
      }
    });
  };

  const inquiryCount = chronologicalRecords.length;

  return (
    <Card className="w-full">
      <SectionHead
        title="Manual intake records"
        subtitle={
          inquiryCount === 1
            ? 'Compare submitted details across linked inquiries and choose the active profile values.'
            : `${inquiryCount} linked inquiries · compare submitted details and choose the active profile values.`
        }
      />
      {matrixRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="pr-3 pb-2 font-bold">Field</th>
                <th className="pr-3 pb-2 font-bold">Original values</th>
                {chronologicalRecords.map((record, index) => (
                  <th key={record.id} className="pr-3 pb-2 font-bold">
                    <span className="block">Inquiry {index + 1}</span>
                    <span className="mt-0.5 block text-[9px] font-medium tracking-normal text-slate-400 normal-case">
                      {formatActivityTimestamp(record.recordedAt, displayTimezone)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={row.label} className="border-t border-slate-200/80 align-top">
                  <td className="py-2 pr-3 font-semibold text-slate-500">{row.label}</td>
                  <td className="py-2 pr-3">
                    {!row.field ? (
                      <span className="text-slate-600">{row.original.trim() || '—'}</span>
                    ) : (
                      <ValueCell
                        value={row.original}
                        field={row.field}
                        profile={profile}
                        pending={pending}
                        onUse={() => handleApplyOriginal(row.field!)}
                      />
                    )}
                  </td>
                  {chronologicalRecords.map((record, index) => (
                    <td key={record.id} className="py-2 pr-3">
                      {!row.field ? (
                        <span className="text-slate-700">{row.inquiries[index]?.trim() || '—'}</span>
                      ) : (
                        <ValueCell
                          value={row.inquiries[index] ?? ''}
                          field={row.field}
                          profile={profile}
                          suggestion={suggestionFor(record, index, row.field)}
                          pending={pending}
                          onUse={() =>
                            handleApplyInquiry(record.id, row.field!, suggestionFor(record, index, row.field!))
                          }
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {chronologicalRecords.map((record, index) => (
          <InquiryFootnote key={record.id} record={record} index={index} timezone={displayTimezone} />
        ))}
      </div>
    </Card>
  );
}
