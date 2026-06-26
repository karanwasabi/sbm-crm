'use client';

import { Download, Send, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MarketingContactBadge } from '@/components/comms/marketing-contact-badge';
import { FilterBar } from '@/components/crm/filter-bar';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { MetaCsvImportDialog } from '@/components/leads/meta-csv-import-dialog';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import { CrmTableLink } from '@/components/layout/crm/crm-table-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StagePill } from '@/components/ui/stage-pill';
import { buildStageFilterOptions, formatLeadAddedAt } from '@/lib/lead-display';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { Lead, LeadSummary, TagFilterMode, TagSuggestion } from '@/types/crm';

type LeadDatabaseViewProps = {
  leads: Lead[];
  summary: LeadSummary;
  activeStage: string;
  activeMarketingStatus: string;
  activeTags: string[];
  activeTagMode: TagFilterMode;
  tagSuggestions: TagSuggestion[];
};

export function LeadDatabaseView({
  leads,
  summary,
  activeStage,
  activeMarketingStatus,
  activeTags,
  activeTagMode,
  tagSuggestions,
}: LeadDatabaseViewProps) {
  const router = useRouter();
  const { setLeadTotal } = useCrmLeadSummary();
  const [importOpen, setImportOpen] = useState(false);
  const stageOptions = buildStageFilterOptions(summary);

  useEffect(() => {
    setLeadTotal(summary.total);
    return () => setLeadTotal(null);
  }, [summary.total, setLeadTotal]);

  return (
    <CrmPageLayout>
      <FilterBar
        activeStage={activeStage}
        stageOptions={stageOptions}
        activeMarketingStatus={activeMarketingStatus}
        activeTags={activeTags}
        activeTagMode={activeTagMode}
        tagSuggestions={tagSuggestions}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[13px] font-semibold text-slate-600">
          Showing <strong className="text-slate-800">{leads.length}</strong> of {summary.total} contacts ·{' '}
          <span className="ml-1.5">0 selected</span>
        </p>
        <div className="flex-1" />
        <Button
          variant="light"
          size="sm"
          leftIcon={<Upload className="h-3.5 w-3.5" />}
          onClick={() => setImportOpen(true)}
        >
          Import CSV (Meta)
        </Button>
        <Button
          variant="light"
          size="sm"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          disabled
          title="Requires Meta Marketing API access"
        >
          Lookalike export (Meta)
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} disabled>
          Message segment
        </Button>
      </div>

      <Card padding="none">
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell className="w-9 pl-4.5">
              <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
            </DataTableHeaderCell>
            {['Name', 'Stage', 'Marketing', 'Program', 'Batch', 'Geography', 'Tags', 'Added', ''].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {leads.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={10} className="py-10 text-center text-sm text-slate-500">
                  No leads yet. Add one from Lead Intake or import Meta CSV.
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
                    {!lead.enriched && lead.medium !== 'offline' && (
                      <span className="text-[10px] font-bold text-motivation">Needs enrichment</span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <StagePill stage={lead.stage} />
                  </DataTableCell>
                  <DataTableCell>
                    <MarketingContactBadge status={lead.marketingContactStatus} />
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
                            {tagSlugToLabel(tag)}
                          </Pill>
                        ))
                      )}
                    </div>
                  </DataTableCell>
                  <DataTableCell>{formatLeadAddedAt(lead.addedAt)}</DataTableCell>
                  <DataTableCell className="text-right">
                    <CrmTableLink
                      href={`/customers/${lead.id}`}
                      className="inline-flex items-center justify-center rounded-2xl border-b-[3px] border-b-slate-200 bg-white px-4 py-2.25 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
                    >
                      View
                    </CrmTableLink>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>

      <MetaCsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          router.refresh();
        }}
      />
    </CrmPageLayout>
  );
}
