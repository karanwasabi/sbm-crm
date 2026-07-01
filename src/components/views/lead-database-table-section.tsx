'use client';

import { useEffect, useRef } from 'react';
import { LeadTimestamp } from '@/components/crm/lead-timestamp';
import { MarketingContactBadge } from '@/components/comms/marketing-contact-badge';
import { LeadDatabasePagination } from '@/components/crm/lead-database-pagination';
import { LeadDatabaseSelectionControls } from '@/components/crm/lead-database-selection-controls';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { SortableHeader } from '@/components/crm/lead-database-sortable-header';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CrmTableLink } from '@/components/layout/crm/crm-table-link';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StagePill } from '@/components/ui/stage-pill';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import { leadDatabaseRangeLabel } from '@/lib/lead-display';
import { tagSlugToLabel } from '@/lib/lead-tags';
import type { Lead, LeadListResult, LeadSummary } from '@/types/crm';

type LeadDatabaseTableSectionProps = {
  listResult: LeadListResult;
  summary: LeadSummary;
  filters: LeadDatabaseFilters;
  loadError?: string | null;
};

export function LeadDatabaseTableSection({
  listResult,
  summary,
  filters,
  loadError = null,
}: LeadDatabaseTableSectionProps) {
  const { items: leads, total, page, pageSize, totalPages } = listResult;
  const { togglePage, pageSelectionState } = useLeadDatabaseSelection();
  const pageState = pageSelectionState(leads);

  return (
    <>
      {loadError ? (
        <Card className="border-danger-press/30 bg-danger/5 p-4 text-sm text-danger-press">
          Could not load leads: {loadError}. Your data is still in the database — this is usually a backend or migration
          issue, not deleted records.
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="text-[13px] font-semibold text-slate-600">
          {leadDatabaseRangeLabel(total, page, pageSize)}
          {total !== summary.total ? (
            <span className="ml-1 font-normal text-slate-500">
              ({summary.total.toLocaleString('en-IN')} total in database)
            </span>
          ) : null}
        </p>
        <LeadDatabaseSelectionControls filters={filters} filteredTotal={total} />
      </div>

      <Card padding="none">
        <DataTable tableClassName="table-fixed">
          <DataTableHead>
            <DataTableHeaderCell className="w-9 pl-4.5">
              <PageSelectCheckbox
                checked={pageState === 'all'}
                indeterminate={pageState === 'some'}
                disabled={leads.length === 0}
                onChange={(checked) => togglePage(leads, checked)}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className="w-52 max-w-52">
              <SortableHeader label="Name" sortKey="name" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell>Stage</DataTableHeaderCell>
            <DataTableHeaderCell>Marketing</DataTableHeaderCell>
            <DataTableHeaderCell>Program</DataTableHeaderCell>
            <DataTableHeaderCell>Batch</DataTableHeaderCell>
            <DataTableHeaderCell>Geography</DataTableHeaderCell>
            <DataTableHeaderCell>Source</DataTableHeaderCell>
            <DataTableHeaderCell className="w-56 max-w-56">Tags</DataTableHeaderCell>
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
                <DataTableCell colSpan={12} className="py-10 text-center text-sm text-slate-500">
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
    </>
  );
}

function PageSelectCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className="h-3.5 w-3.5 accent-brand"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label="Select all leads on this page"
    />
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const { isSelected, toggleLead } = useLeadDatabaseSelection();

  return (
    <DataTableRow>
      <DataTableCell className="pl-4.5">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-brand"
          checked={isSelected(lead.id)}
          onChange={() => toggleLead(lead)}
          aria-label={`Select ${lead.name}`}
        />
      </DataTableCell>
      <DataTableCell className="w-52 max-w-52">
        <div className="truncate font-semibold text-slate-800">{lead.name}</div>
        <div className="truncate text-[11px] text-slate-500">{lead.email}</div>
        {lead.dedup && <span className="text-[10px] font-bold text-danger-press">Possible duplicate</span>}
        {lead.unseenSuggestionCount > 0 && (
          <span className="text-[10px] font-bold text-brand">{lead.unseenSuggestionCount} unseen update(s)</span>
        )}
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
      <DataTableCell>{lead.sourceLabel || '—'}</DataTableCell>
      <DataTableCell className="w-56 max-w-56">
        <div className="flex max-w-56 flex-wrap gap-1">
          {lead.tags.length === 0 ? (
            <span className="text-[10px] text-slate-400">—</span>
          ) : (
            lead.tags.map((tag) => (
              <Pill key={tag} tone="brand" className="px-2 py-0.5 text-[9px] tracking-wide">
                {tagSlugToLabel(tag)}
              </Pill>
            ))
          )}
        </div>
      </DataTableCell>
      <DataTableCell className="text-[12px] whitespace-nowrap text-slate-600">
        <LeadTimestamp iso={lead.addedAt} />
      </DataTableCell>
      <DataTableCell className="text-[12px] whitespace-nowrap text-slate-600">
        <LeadTimestamp iso={lead.updatedAt} />
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
