'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarketingContactBadge } from '@/components/comms/marketing-contact-badge';
import { FilterBar } from '@/components/crm/filter-bar';
import { LeadDatabaseActiveFilters } from '@/components/crm/lead-database-active-filters';
import { LeadDatabaseFiltersPanel } from '@/components/crm/lead-database-filters-panel';
import { LeadDatabasePagination, leadDatabaseRangeLabel } from '@/components/crm/lead-database-pagination';
import { SortableHeader } from '@/components/crm/lead-database-sortable-header';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import { CrmTableLink } from '@/components/layout/crm/crm-table-link';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StagePill } from '@/components/ui/stage-pill';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { buildStageFilterOptions, formatLeadTimestamp } from '@/lib/lead-display';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { Lead, LeadFilterOptions, LeadListResult, LeadSummary, TagSuggestion } from '@/types/crm';

type LeadDatabaseViewProps = {
  listResult: LeadListResult;
  summary: LeadSummary;
  filters: LeadDatabaseFilters;
  filterOptions: LeadFilterOptions;
  loadError?: string | null;
  tagSuggestions: TagSuggestion[];
};

export function LeadDatabaseView({
  listResult,
  summary,
  filters,
  filterOptions,
  loadError = null,
  tagSuggestions,
}: LeadDatabaseViewProps) {
  const router = useRouter();
  const { setLeadTotal } = useCrmLeadSummary();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const stageOptions = buildStageFilterOptions(summary);
  const { items: leads, total, page, pageSize, totalPages } = listResult;

  useEffect(() => {
    setLeadTotal(summary.total);
    return () => setLeadTotal(null);
  }, [summary.total, setLeadTotal]);

  return (
    <CrmPageLayout>
      {loadError ? (
        <Card className="border-danger-press/30 bg-danger/5 p-4 text-sm text-danger-press">
          Could not load leads: {loadError}. Your data is still in the database — this is usually a backend or migration
          issue, not deleted records.
        </Card>
      ) : null}

      <FilterBar
        filters={filters}
        stageOptions={stageOptions}
        tagSuggestions={tagSuggestions}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <LeadDatabaseActiveFilters filters={filters} />

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[13px] font-semibold text-slate-600">
          {leadDatabaseRangeLabel(total, page, pageSize)}
          {total !== summary.total ? (
            <span className="ml-1 font-normal text-slate-500">
              ({summary.total.toLocaleString('en-IN')} total in database)
            </span>
          ) : null}
          <span className="ml-1.5">· 0 selected</span>
        </p>
      </div>

      <Card padding="none">
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell className="w-9 pl-4.5">
              <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
            </DataTableHeaderCell>
            <DataTableHeaderCell>
              <SortableHeader label="Name" sortKey="name" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell>Stage</DataTableHeaderCell>
            <DataTableHeaderCell>Marketing</DataTableHeaderCell>
            <DataTableHeaderCell>Program</DataTableHeaderCell>
            <DataTableHeaderCell>Batch</DataTableHeaderCell>
            <DataTableHeaderCell>Geography</DataTableHeaderCell>
            <DataTableHeaderCell>Tags</DataTableHeaderCell>
            <DataTableHeaderCell>
              <SortableHeader label="Added" sortKey="created_at" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell>
              <SortableHeader label="Updated" sortKey="updated_at" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell>{'\u00a0'}</DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {leads.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={11} className="py-10 text-center text-sm text-slate-500">
                  No leads match these filters.
                </DataTableCell>
              </DataTableRow>
            ) : (
              leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
            )}
          </DataTableBody>
        </DataTable>
      </Card>

      <LeadDatabasePagination filters={filters} total={total} page={page} pageSize={pageSize} totalPages={totalPages} />

      <LeadDatabaseFiltersPanel
        open={filtersOpen}
        filters={filters}
        filterOptions={filterOptions}
        onClose={() => setFiltersOpen(false)}
        onApply={(patch) => {
          router.push(buildLeadDatabaseHref(filters, patch));
          setFiltersOpen(false);
        }}
        onClear={() => {
          router.push(
            buildLeadDatabaseHref(filters, {
              programs: [],
              batches: [],
              geography: [],
              addedFrom: '',
              addedTo: '',
              updatedFrom: '',
              updatedTo: '',
              sort: 'created_at',
              order: 'desc',
            })
          );
          setFiltersOpen(false);
        }}
      />
    </CrmPageLayout>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <DataTableRow>
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
      <DataTableCell className="text-[12px] whitespace-nowrap text-slate-600">
        {formatLeadTimestamp(lead.addedAt)}
      </DataTableCell>
      <DataTableCell className="text-[12px] whitespace-nowrap text-slate-600">
        {formatLeadTimestamp(lead.updatedAt)}
      </DataTableCell>
      <DataTableCell className="text-right">
        <CrmTableLink
          href={`/customers/${lead.id}`}
          className="inline-flex items-center justify-center rounded-2xl border-b-[3px] border-b-slate-200 bg-white px-4 py-2.25 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
        >
          View
        </CrmTableLink>
      </DataTableCell>
    </DataTableRow>
  );
}
