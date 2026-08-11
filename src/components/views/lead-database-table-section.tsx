'use client';

import { useEffect, useRef } from 'react';
import { LeadTableTimestamp } from '@/components/crm/lead-timestamp';
import { MarketingContactBadge } from '@/components/comms/marketing-contact-badge';
import { LeadDatabasePagination } from '@/components/crm/lead-database-pagination';
import { LeadDatabaseSelectionControls } from '@/components/crm/lead-database-selection-controls';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { TruncatedContainerTooltip, TruncatedWithTooltip } from '@/components/crm/truncated-with-tooltip';
import { SortableHeader } from '@/components/crm/lead-database-sortable-header';
import { MemberKindPill } from '@/components/ui/member-kind-pill';
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

function LeadDatabaseTableColGroup({ showReferrerCoach }: { showReferrerCoach: boolean }) {
  if (!showReferrerCoach) {
    return (
      <colgroup>
        <col style={{ width: '2%' }} />
        <col style={{ width: '13%' }} />
        <col style={{ width: '6%' }} />
        <col style={{ width: '7%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '6%' }} />
        <col style={{ width: '7%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '5%' }} />
        <col style={{ width: '5%' }} />
        <col style={{ width: '6%' }} />
      </colgroup>
    );
  }

  return (
    <colgroup>
      <col style={{ width: '2%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '5%' }} />
      <col style={{ width: '5%' }} />
      <col style={{ width: '5%' }} />
    </colgroup>
  );
}

const leadDbHeaderCell = 'px-2 py-2';
const leadDbCell = 'overflow-hidden px-2 py-2.5';

export function LeadDatabaseTableSection({
  listResult,
  summary,
  filters,
  loadError = null,
}: LeadDatabaseTableSectionProps) {
  const { items: leads, total, page, pageSize, totalPages } = listResult;
  const { togglePage, pageSelectionState } = useLeadDatabaseSelection();
  const pageState = pageSelectionState(leads);
  const showReferrerCoach = filters.referrerCoaches.length > 0;
  const columnCount = showReferrerCoach ? 13 : 12;

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
        <DataTable className="overflow-x-hidden" tableClassName="w-full table-fixed">
          <LeadDatabaseTableColGroup showReferrerCoach={showReferrerCoach} />
          <DataTableHead>
            <DataTableHeaderCell className={`${leadDbHeaderCell} pl-3`}>
              <PageSelectCheckbox
                checked={pageState === 'all'}
                indeterminate={pageState === 'some'}
                disabled={leads.length === 0}
                onChange={(checked) => togglePage(leads, checked)}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>
              <SortableHeader label="Name" sortKey="name" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Stage</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Marketing</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Program</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Batch</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Geography</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>Source</DataTableHeaderCell>
            {showReferrerCoach ? (
              <DataTableHeaderCell className={leadDbHeaderCell}>Referrer&apos;s coach</DataTableHeaderCell>
            ) : null}
            <DataTableHeaderCell className={leadDbHeaderCell}>Tags</DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>
              <SortableHeader label="Added" sortKey="created_at" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>
              <SortableHeader label="Updated" sortKey="updated_at" filters={filters} />
            </DataTableHeaderCell>
            <DataTableHeaderCell className={leadDbHeaderCell}>{'\u00a0'}</DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {leads.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={columnCount} className="py-10 text-center text-sm text-slate-500">
                  No leads match these filters.
                </DataTableCell>
              </DataTableRow>
            ) : (
              leads.map((lead) => <LeadRow key={lead.id} lead={lead} showReferrerCoach={showReferrerCoach} />)
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

function LeadRow({ lead, showReferrerCoach }: { lead: Lead; showReferrerCoach: boolean }) {
  const { isSelected, toggleLead } = useLeadDatabaseSelection();
  const referrerCoachLabel = lead.referrerCoachName?.trim() || 'Unassigned';

  return (
    <DataTableRow>
      <DataTableCell className={`${leadDbCell} pl-3`}>
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-brand"
          checked={isSelected(lead.id)}
          onChange={() => toggleLead(lead)}
          aria-label={`Select ${lead.name}`}
        />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <TruncatedWithTooltip text={lead.name} className="font-semibold text-slate-800" />
        {lead.memberKind === 'renewal' || lead.memberKind === 'returnee' || lead.latestRenewalDuration ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {lead.memberKind === 'renewal' || lead.memberKind === 'returnee' ? (
              <MemberKindPill kind={lead.memberKind} />
            ) : null}
            {lead.latestRenewalDuration ? (
              <Pill tone="brand" className="text-[10px] tracking-wide normal-case">
                Renewed · {lead.latestRenewalDuration}
              </Pill>
            ) : null}
          </div>
        ) : null}
        <TruncatedWithTooltip text={lead.email} className="text-[11px] text-slate-500" />
        {lead.dedup && <span className="text-[10px] font-bold text-danger-press">Possible duplicate</span>}
        {lead.phoneDuplicate && (
          <span className="text-[10px] font-bold text-danger-press">
            Phone duplicate{lead.phoneDuplicateCount > 1 ? ` (${lead.phoneDuplicateCount})` : ''}
          </span>
        )}
        {lead.unseenSuggestionCount > 0 && (
          <span className="text-[10px] font-bold text-brand">{lead.unseenSuggestionCount} unseen update(s)</span>
        )}
        {!lead.enriched && lead.medium !== 'offline' && (
          <span className="text-[10px] font-bold text-motivation">Needs enrichment</span>
        )}
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <StagePill stage={lead.stage} />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <MarketingContactBadge status={lead.marketingContactStatus} />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <TruncatedWithTooltip text={lead.interest} className="font-semibold" />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <TruncatedWithTooltip text={lead.batch} />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <TruncatedWithTooltip text={lead.location || '—'} className={lead.location ? undefined : 'text-slate-400'} />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <TruncatedWithTooltip
          text={lead.sourceLabel || '—'}
          className={lead.sourceLabel ? undefined : 'text-slate-400'}
        />
      </DataTableCell>
      {showReferrerCoach ? (
        <DataTableCell className={leadDbCell}>
          <TruncatedWithTooltip
            text={referrerCoachLabel}
            className={lead.referrerCoachName ? 'font-semibold text-slate-700' : 'text-slate-400'}
          />
        </DataTableCell>
      ) : null}
      <DataTableCell className={`${leadDbCell} align-top`}>
        <TruncatedContainerTooltip className="flex flex-wrap gap-1" tooltip={lead.tags.map(tagSlugToLabel).join(' · ')}>
          {lead.tags.length === 0 ? (
            <span className="text-[10px] text-slate-400">—</span>
          ) : (
            lead.tags.map((tag) => (
              <Pill key={tag} tone="brand" className="px-2 py-0.5 text-[9px] tracking-wide">
                {tagSlugToLabel(tag)}
              </Pill>
            ))
          )}
        </TruncatedContainerTooltip>
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <LeadTableTimestamp iso={lead.addedAt} />
      </DataTableCell>
      <DataTableCell className={leadDbCell}>
        <LeadTableTimestamp iso={lead.updatedAt} />
      </DataTableCell>
      <DataTableCell className={`${leadDbCell} pr-3 text-right`}>
        <CrmTableLink
          href={`/customers/${lead.id}`}
          className="inline-flex items-center justify-center rounded-xl border-b-2 border-b-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
        >
          View
        </CrmTableLink>
      </DataTableCell>
    </DataTableRow>
  );
}
