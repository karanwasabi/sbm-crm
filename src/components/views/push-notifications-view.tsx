'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { createPushTemplateAction, patchCohortPushTemplateAction } from '@/app/(crm)/push-notifications/actions';
import { TabBar } from '@/components/crm/tab-bar';
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
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
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
      <SectionHead
        title="Push notifications"
        subtitle="Habit nudge templates by week, day, and time slot. Superadmin only."
      />
      <TabBar tabs={[...TABS]} active={tab} onChange={(next) => setTab(next as (typeof TABS)[number])} />

      {tab === 'Templates' ? (
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <p className="text-sm font-semibold text-slate-800">Create template</p>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Name" className="min-w-[240px] flex-1">
                <TextInput value={name} onChange={setName} placeholder="e.g. Take Control 2026 default" />
              </Field>
              <Button variant="primary" onClick={createTemplate} loading={pending}>
                Create
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Weeks</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Open</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {templates.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                      No templates yet.
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  templates.map((template) => (
                    <DataTableRow key={template.id}>
                      <DataTableCell className="font-semibold text-slate-800">{template.name}</DataTableCell>
                      <DataTableCell>
                        <Pill tone={statusTone(template.status)}>{template.status}</Pill>
                      </DataTableCell>
                      <DataTableCell>{template.maxWeek}</DataTableCell>
                      <DataTableCell className="text-right">
                        <Link
                          href={`/push-notifications/${template.id}`}
                          className="text-sm font-semibold text-brand no-underline hover:underline"
                        >
                          Edit
                        </Link>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </Card>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
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
                    <DataTableCell>{row.startsOn}</DataTableCell>
                    <DataTableCell>{row.status}</DataTableCell>
                    <DataTableCell>
                      <select
                        className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={pending}
                        value={row.templateId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value && activeTemplates.find((t) => t.id === value)?.status === 'draft') {
                            const confirmed = window.confirm(
                              'This template is still draft. The worker only sends active templates. Assign anyway?'
                            );
                            if (!confirmed) {
                              event.target.value = row.templateId ?? '';
                              return;
                            }
                          }
                          assign(row.cohortId, value || null);
                        }}
                      >
                        <option value="">— None —</option>
                        {activeTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.status})
                          </option>
                        ))}
                      </select>
                      {row.templateStatus === 'archived' ? (
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
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
