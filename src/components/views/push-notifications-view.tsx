'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Bell, CalendarDays, Layers3, Plus, Sparkles } from 'lucide-react';
import { createPushTemplateAction, patchCohortPushTemplateAction } from '@/app/(crm)/push-notifications/actions';
import { KpiStrip } from '@/components/crm/kpi-strip';
import { CrmTableLink } from '@/components/layout/crm/crm-table-link';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import type { CohortPushAssignment, PushTemplate, PushTemplateStatus } from '@/utils/api';

const TABS = ['Templates', 'Cohort assignment'] as const;

type PushNotificationsViewProps = {
  templates: PushTemplate[];
  assignments: CohortPushAssignment[];
};

function statusTone(status: PushTemplateStatus): 'success' | 'neutral' | 'warn' {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'neutral';
  return 'warn';
}

const selectClassName =
  'w-full max-w-xs rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand disabled:bg-slate-50';

export function PushNotificationsView({ templates, assignments }: PushNotificationsViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Templates');
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.status === 'active' || t.status === 'draft'),
    [templates]
  );
  const activeCount = templates.filter((t) => t.status === 'active').length;
  const assignedCount = assignments.filter((a) => a.templateId != null).length;
  const totalWeeks = templates.reduce((sum, t) => sum + t.maxWeek, 0);

  const createTemplate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ message: 'Enter a template name.', variant: 'error' });
      return;
    }
    startTransition(async () => {
      try {
        const created = await createPushTemplateAction(trimmed);
        toast({ message: 'Template created.', variant: 'success' });
        router.push(`/push-notifications/${created.id}`);
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to create template.',
          variant: 'error',
        });
      }
    });
  };

  const assign = (cohortId: string, templateId: string | null) => {
    startTransition(async () => {
      try {
        await patchCohortPushTemplateAction(cohortId, templateId);
        toast({ message: templateId ? 'Template assigned.' : 'Template cleared.', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update assignment.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border-b-[6px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10 blur-[28px]" />
        </div>
        <div className="relative z-1 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase">
              <Bell className="h-3.5 w-3.5" aria-hidden />
              Habit pushes
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Scheduled cohort nudges</h2>
            <p className="max-w-xl text-sm font-medium text-white/85">
              Build week × day × slot copy, activate a template, then assign it to a take-control cohort. Sends follow
              each member&apos;s timezone.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-black/15 px-4 py-3 text-right">
            <p className="text-[10px] font-bold tracking-[0.12em] text-white/70 uppercase">Slots / day</p>
            <p className="text-2xl font-extrabold tabular-nums">4</p>
            <p className="text-[11px] font-medium text-white/75">9am · 3pm · 8pm · 9pm</p>
          </div>
        </div>
      </div>

      <KpiStrip
        columnsClassName="sm:grid-cols-2 xl:grid-cols-4"
        items={[
          {
            label: 'Templates',
            value: String(templates.length),
            sub: 'Reusable catalogs',
            accent: '#5C65CF',
            icon: Layers3,
          },
          {
            label: 'Active',
            value: String(activeCount),
            sub: 'Worker will send these',
            accent: '#10B981',
            icon: Sparkles,
          },
          {
            label: 'Weeks authored',
            value: String(totalWeeks),
            sub: 'Across all templates',
            accent: '#8B5CF6',
            icon: CalendarDays,
          },
          {
            label: 'Cohorts assigned',
            value: String(assignedCount),
            sub: `${assignments.length} take-control total`,
            accent: '#0EA5E9',
            icon: Bell,
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <FilterChip key={item} active={tab === item} onClick={() => setTab(item)}>
            {item}
          </FilterChip>
        ))}
      </div>

      {tab === 'Templates' ? (
        <div className="space-y-4">
          <Card
            padding="md"
            className="border-[#B8BEF5] bg-linear-to-br from-[#F7F8FF] via-[#EEF0FF] to-[#E4E7FF] shadow-[0_1px_3px_rgba(92,101,207,0.08)]"
          >
            <SectionHead
              title="Create template"
              subtitle="Starts with week 1 (28 empty slots). Add more weeks in the editor."
              className="mb-4"
            />
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Name" className="min-w-[240px] flex-1">
                <TextInput
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Take Control 2026 default"
                  disabled={pending}
                />
              </Field>
              <Button
                variant="primary"
                onClick={createTemplate}
                loading={pending}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create
              </Button>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-slate-100 bg-linear-to-r from-brand/[0.06] via-white to-white px-5 py-4">
              <SectionHead
                title="Templates"
                subtitle={`${templates.length} template${templates.length === 1 ? '' : 's'}`}
                className="mb-0"
              />
            </div>
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Copy ready</DataTableHeaderCell>
                <DataTableHeaderCell>Weeks</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Open</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {templates.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      No templates yet. Create one above to get started.
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  templates.map((template) => {
                    const incomplete = template.totalSlots > 0 && template.readySlots < template.totalSlots;
                    return (
                      <DataTableRow key={template.id}>
                        <DataTableCell className="font-semibold text-slate-800">{template.name}</DataTableCell>
                        <DataTableCell>
                          <Pill tone={statusTone(template.status)}>{template.status}</Pill>
                          {template.status === 'active' && incomplete ? (
                            <p className="mt-1 text-[11px] font-medium text-amber-700">
                              Active but incomplete — worker skips empty slots
                            </p>
                          ) : null}
                        </DataTableCell>
                        <DataTableCell className="tabular-nums">
                          <span className={incomplete ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                            {template.readySlots}/{template.totalSlots || '—'}
                          </span>
                        </DataTableCell>
                        <DataTableCell className="tabular-nums">{template.maxWeek}</DataTableCell>
                        <DataTableCell className="text-right">
                          <CrmTableLink href={`/push-notifications/${template.id}`}>Edit</CrmTableLink>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
          </Card>
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-slate-100 bg-linear-to-r from-brand/[0.06] via-white to-white px-5 py-4">
            <SectionHead
              title="Cohort assignment"
              subtitle="One template per take-control cohort. Only active templates are sent."
              className="mb-0"
            />
          </div>
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Cohort</DataTableHeaderCell>
              <DataTableHeaderCell>Starts</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Assigned template</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {assignments.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    No take-control cohorts found.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                assignments.map((row) => (
                  <DataTableRow key={row.cohortId}>
                    <DataTableCell>
                      <div className="font-semibold text-slate-800">{row.cohortName}</div>
                      <div className="text-[11px] text-slate-500">{row.programName}</div>
                    </DataTableCell>
                    <DataTableCell className="tabular-nums">{row.startsOn}</DataTableCell>
                    <DataTableCell>
                      <Pill tone="neutral">{row.status}</Pill>
                    </DataTableCell>
                    <DataTableCell>
                      <select
                        className={cn(selectClassName)}
                        disabled={pending}
                        value={row.templateId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value) {
                            const selected = activeTemplates.find((t) => t.id === value);
                            if (selected?.status === 'draft') {
                              const confirmed = window.confirm(
                                'This template is still draft. The worker only sends active templates. Assign anyway?'
                              );
                              if (!confirmed) {
                                event.target.value = row.templateId ?? '';
                                return;
                              }
                            } else if (
                              selected &&
                              selected.totalSlots > 0 &&
                              selected.readySlots < selected.totalSlots
                            ) {
                              const confirmed = window.confirm(
                                `This template only has ${selected.readySlots}/${selected.totalSlots} slots with copy. Empty slots will not send. Assign anyway?`
                              );
                              if (!confirmed) {
                                event.target.value = row.templateId ?? '';
                                return;
                              }
                            }
                          }
                          assign(row.cohortId, value || null);
                        }}
                      >
                        <option value="">— None —</option>
                        {activeTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.status}, {template.readySlots}/{template.totalSlots} ready)
                          </option>
                        ))}
                      </select>
                      {row.templateStatus === 'archived' ? (
                        <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                          Assigned template is archived — worker will not send.
                        </p>
                      ) : null}
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </Card>
      )}
    </div>
  );
}
