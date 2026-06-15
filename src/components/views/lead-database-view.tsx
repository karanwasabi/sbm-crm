'use client';

import { Download, Send, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilterBar } from '@/components/crm/filter-bar';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StagePill } from '@/components/ui/stage-pill';
import { buildStageFilterOptions, formatLeadAddedAt } from '@/lib/lead-display';
import type { Lead, LeadSummary } from '@/types/crm';

type LeadDatabaseViewProps = {
  leads: Lead[];
  summary: LeadSummary;
  activeStage: string;
};

export function LeadDatabaseView({ leads, summary, activeStage }: LeadDatabaseViewProps) {
  const router = useRouter();
  const stageOptions = buildStageFilterOptions(summary);

  const handleStageChange = (stage: string) => {
    const href = stage === 'all' ? '/database' : `/database?stage=${encodeURIComponent(stage)}`;
    router.push(href);
  };

  return (
    <CrmPageLayout>
      <FilterBar activeStage={activeStage} onStageChange={handleStageChange} stageOptions={stageOptions} />

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[13px] font-semibold text-slate-600">
          Showing <strong className="text-slate-800">{leads.length}</strong> of {summary.total} contacts ·{' '}
          <span className="ml-1.5">0 selected</span>
        </p>
        <div className="flex-1" />
        <Button variant="light" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />}>
          Import CSV (Zoho)
        </Button>
        <Button variant="light" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
          Lookalike export (Meta)
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>
          Message segment
        </Button>
      </div>

      <Card padding="none">
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell className="w-9 pl-4.5">
              <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
            </DataTableHeaderCell>
            {['Name', 'Stage', 'Program', 'Batch', 'Geography', 'Tags', 'Added', ''].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {leads.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">
                  No leads yet. Add one from Lead Intake.
                </DataTableCell>
              </DataTableRow>
            ) : (
              leads.map((lead) => (
                <DataTableRow key={lead.id}>
                  <DataTableCell className="pl-4.5">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="font-semibold text-slate-800">{lead.name}</div>
                    <div className="text-[11px] text-slate-500">{lead.email}</div>
                    {lead.dedup && <span className="text-[10px] font-bold text-danger-press">Possible duplicate</span>}
                    {!lead.enriched && <span className="text-[10px] font-bold text-motivation">Needs enrichment</span>}
                  </DataTableCell>
                  <DataTableCell>
                    <StagePill stage={lead.stage} />
                  </DataTableCell>
                  <DataTableCell className="font-semibold">{lead.interest}</DataTableCell>
                  <DataTableCell>{lead.batch}</DataTableCell>
                  <DataTableCell>{lead.location || '—'}</DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        lead.tags.map((tag) => (
                          <Pill key={tag} tone="brand">
                            {tag}
                          </Pill>
                        ))
                      )}
                    </div>
                  </DataTableCell>
                  <DataTableCell>{formatLeadAddedAt(lead.addedAt)}</DataTableCell>
                  <DataTableCell className="text-right">
                    <Link href={`/customers/${lead.id}`}>
                      <Button variant="light" size="sm">
                        View
                      </Button>
                    </Link>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>
    </CrmPageLayout>
  );
}
