'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { KpiCard } from '@/components/crm/kpi-card';
import { PerformanceSortableHeader } from '@/components/crm/performance-sortable-header';
import { RenewalsFilterBar } from '@/components/crm/renewals-filter-bar';
import { RenewalsPagination } from '@/components/crm/renewals-pagination';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { CustomerDetailSkeleton } from '@/components/loading/customer-detail-skeleton';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { useCrmRenewalSummary } from '@/components/layout/crm/crm-renewal-summary-context';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { MemberKindPill } from '@/components/ui/member-kind-pill';
import { StagePill } from '@/components/ui/stage-pill';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { useCrmNavigate } from '@/hooks/use-crm-navigate';
import { fetchRenewalLeadIds } from '@/lib/fetch-renewal-lead-ids';
import {
  accessStateLabel,
  bucketLabel,
  bucketTone,
  formatAccessExpiryLabel,
  membershipProductLabel,
  renewalMemberStatusId,
  renewalSubtitle,
} from '@/lib/renewal-display';
import {
  DEFAULT_RENEWAL_FILTERS,
  buildRenewalsHref,
  renewalFiltersKey,
  type RenewalFilters,
  type RenewalSortKey,
} from '@/lib/renewal-query';
import { cn } from '@/lib/cn';
import type { RenewalListPage, RenewalRow, RenewalSummary } from '@/types/crm';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

const C360_FROM_KEY = 'sbm-crm-c360-from';

type RenewalsViewProps = {
  summary: RenewalSummary;
  page: RenewalListPage;
  filters: RenewalFilters;
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappSendsEnabled: boolean;
};

export function RenewalsView({
  summary,
  page,
  filters,
  emailTemplates,
  whatsappTemplates,
  whatsappSendsEnabled,
}: RenewalsViewProps) {
  const { push, isPending, pendingHref } = useCrmNavigate();
  const { setRenewalSubtitle } = useCrmRenewalSummary();
  const filterKey = renewalFiltersKey(filters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [filteredLeadIds, setFilteredLeadIds] = useState<string[] | null>(null);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [clickedRowId, setClickedRowId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const navigate = useCallback(
    (href: string) => {
      push(href);
    },
    [push]
  );

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
    setFilteredLeadIds(null);
    abortRef.current?.abort();
    setPreparingOpen(false);
  }, [filterKey]);

  useEffect(() => {
    setRenewalSubtitle(renewalSubtitle(summary));
    return () => setRenewalSubtitle(null);
  }, [summary, setRenewalSubtitle]);

  const rows = page.items;
  const pageSelectable = rows.filter((row) => row.leadId);
  const allPageSelected =
    pageSelectable.length > 0 && pageSelectable.every((row) => selectedIds.has(row.checkoutSessionId));
  const somePageSelected = pageSelectable.some((row) => selectedIds.has(row.checkoutSessionId));

  const { sendLeadIds, skippedCount } = useMemo(() => {
    if (selectAllFiltered && filteredLeadIds) {
      return { sendLeadIds: filteredLeadIds, skippedCount: 0 };
    }
    const ids: string[] = [];
    const seen = new Set<string>();
    let skipped = 0;
    for (const row of rows) {
      if (!selectedIds.has(row.checkoutSessionId)) continue;
      const leadId = row.leadId?.trim();
      if (!leadId) {
        skipped += 1;
        continue;
      }
      if (seen.has(leadId)) continue;
      seen.add(leadId);
      ids.push(leadId);
    }
    return { sendLeadIds: ids, skippedCount: skipped };
  }, [filteredLeadIds, rows, selectAllFiltered, selectedIds]);

  const isTableLoading = isPending && Boolean(pendingHref?.startsWith('/renewals'));
  const isOpeningCustomer = isPending && Boolean(pendingHref?.startsWith('/customers/'));

  const handleSort = (sortKey: RenewalSortKey) => {
    const nextOrder = filters.sort === sortKey && filters.order === 'asc' ? 'desc' : 'asc';
    navigate(buildRenewalsHref(filters, { sort: sortKey, order: nextOrder }));
  };

  const togglePageSelection = (checked: boolean) => {
    setSelectAllFiltered(false);
    setFilteredLeadIds(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const row of pageSelectable) {
        if (checked) next.add(row.checkoutSessionId);
        else next.delete(row.checkoutSessionId);
      }
      return next;
    });
  };

  const toggleRow = (row: RenewalRow) => {
    setSelectAllFiltered(false);
    setFilteredLeadIds(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(row.checkoutSessionId)) next.delete(row.checkoutSessionId);
      else next.add(row.checkoutSessionId);
      return next;
    });
  };

  const selectAllMatching = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPreparingOpen(true);
    try {
      const result = await fetchRenewalLeadIds(filters);
      if (controller.signal.aborted) return;
      setFilteredLeadIds(result.ids);
      setSelectAllFiltered(true);
      setSelectedIds(new Set(pageSelectable.map((row) => row.checkoutSessionId)));
    } finally {
      if (!controller.signal.aborted) {
        setPreparingOpen(false);
      }
    }
  };

  const openCustomer = (row: RenewalRow) => {
    if (!row.leadId) return;
    setClickedRowId(row.checkoutSessionId);
    sessionStorage.setItem(C360_FROM_KEY, 'renewals');
    navigate(`/customers/${row.leadId}`);
  };

  if (isOpeningCustomer) {
    return <CustomerDetailSkeleton />;
  }

  return (
    <CrmPageLayout>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          className="cursor-pointer text-left"
          onClick={() => navigate(buildRenewalsHref(DEFAULT_RENEWAL_FILTERS, { expiry: '7d' }))}
        >
          <KpiCard
            label="Expiring in 7 days"
            value={String(summary.expiring7d)}
            sub="Inclusive access end"
            accent="#F43F5E"
          />
        </button>
        <button
          type="button"
          className="cursor-pointer text-left"
          onClick={() => navigate(buildRenewalsHref(DEFAULT_RENEWAL_FILTERS, { expiry: '30d' }))}
        >
          <KpiCard
            label="Expiring in 30 days"
            value={String(summary.expiring30d)}
            sub="Soonest members first"
            accent="#FFB703"
          />
        </button>
        <button
          type="button"
          className="cursor-pointer text-left"
          onClick={() => navigate(buildRenewalsHref(DEFAULT_RENEWAL_FILTERS, { access: 'grace' }))}
        >
          <KpiCard label="In grace" value={String(summary.inGrace)} sub="Access ended, grace open" accent="#F97316" />
        </button>
        <button
          type="button"
          className="cursor-pointer text-left"
          onClick={() => navigate(buildRenewalsHref(DEFAULT_RENEWAL_FILTERS))}
        >
          <KpiCard
            label="Active + grace"
            value={String(summary.activeOrGrace)}
            sub={`${summary.atRiskCount} at retention risk`}
            accent="#5C65CF"
          />
        </button>
      </div>

      <RenewalsFilterBar
        filters={filters}
        summary={summary}
        onNavigate={navigate}
        pendingHref={pendingHref}
        isNavigating={isTableLoading}
        leadIds={sendLeadIds}
        skippedCount={skippedCount}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        whatsappSendsEnabled={whatsappSendsEnabled}
        pageItems={rows}
        selectedIds={selectedIds}
        selectAllFiltered={selectAllFiltered}
        selectedCount={selectAllFiltered ? page.total : selectedIds.size}
      />

      <Card padding="none" className={cn(isTableLoading && 'pointer-events-none')}>
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
          <SectionHead
            title="Membership expiry"
            subtitle={
              isTableLoading
                ? 'Loading members…'
                : `${page.total.toLocaleString('en-IN')} member${page.total === 1 ? '' : 's'} · soonest access end first`
            }
          />
          {page.total > rows.length ? (
            <button type="button" className="text-xs font-semibold text-brand" onClick={() => void selectAllMatching()}>
              {selectAllFiltered
                ? `All ${page.total.toLocaleString('en-IN')} matching selected`
                : `Select all ${page.total.toLocaleString('en-IN')} matching filters`}
            </button>
          ) : null}
        </div>
        {isTableLoading ? (
          <TableSkeleton columns={7} rows={8} showHeader embedded />
        ) : (
          <>
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell className="w-10 pl-3">
                  <SelectAllCheckbox
                    checked={selectAllFiltered || allPageSelected}
                    indeterminate={!selectAllFiltered && somePageSelected && !allPageSelected}
                    disabled={pageSelectable.length === 0}
                    onChange={togglePageSelection}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>
                  <PerformanceSortableHeader
                    label="Member"
                    sortKey="name"
                    activeSortKey={filters.sort}
                    sortDirection={filters.order}
                    onSort={handleSort}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>
                  <PerformanceSortableHeader
                    label="Product"
                    sortKey="product"
                    activeSortKey={filters.sort}
                    sortDirection={filters.order}
                    onSort={handleSort}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>
                  <PerformanceSortableHeader
                    label="Cohort"
                    sortKey="cohort"
                    activeSortKey={filters.sort}
                    sortDirection={filters.order}
                    onSort={handleSort}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>
                  <PerformanceSortableHeader
                    label="Expires"
                    sortKey="access_until"
                    activeSortKey={filters.sort}
                    sortDirection={filters.order}
                    onSort={handleSort}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>Retention</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      No members match this filter.
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  rows.map((row) => {
                    const opening = clickedRowId === row.checkoutSessionId && isPending;
                    return (
                      <DataTableRow
                        key={row.checkoutSessionId}
                        className={cn(opening && 'opacity-60')}
                        onClick={row.leadId ? () => openCustomer(row) : undefined}
                      >
                        <DataTableCell className="pl-3">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-brand"
                            checked={selectAllFiltered || selectedIds.has(row.checkoutSessionId)}
                            disabled={!row.leadId}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleRow(row)}
                            aria-label={`Select ${row.memberName}`}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                              {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : row.memberInitials}
                            </div>
                            <span className="font-semibold text-slate-800">{row.memberName}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <RenewalMemberStatus row={row} />
                        </DataTableCell>
                        <DataTableCell className="text-slate-700">{membershipProductLabel(row)}</DataTableCell>
                        <DataTableCell>{row.cohortName}</DataTableCell>
                        <DataTableCell className="text-slate-600">{formatAccessExpiryLabel(row)}</DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <Pill tone={bucketTone(row.retentionBucket)}>{bucketLabel(row.retentionBucket)}</Pill>
                            {row.accessState !== 'active' ? (
                              <Pill tone={row.accessState === 'grace' ? 'warn' : 'neutral'}>
                                {accessStateLabel(row.accessState)}
                              </Pill>
                            ) : null}
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
            <RenewalsPagination
              filters={filters}
              total={page.total}
              page={page.page}
              pageSize={page.pageSize}
              totalPages={page.totalPages}
            />
          </>
        )}
      </Card>
      <LeadExportPreparingDialog
        open={preparingOpen}
        selectedCount={page.total}
        onCancel={() => {
          abortRef.current?.abort();
          setPreparingOpen(false);
        }}
      />
    </CrmPageLayout>
  );
}

function RenewalMemberStatus({ row }: { row: RenewalRow }) {
  const status = renewalMemberStatusId(row);
  if (status === 'returnee' || status === 'renewal') {
    return <MemberKindPill kind={status} />;
  }
  if (status === 'newbie') return <StagePill stage="newbie" />;
  return <StagePill stage="member" />;
}

function SelectAllCheckbox({
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
      aria-label="Select all members on this page"
    />
  );
}
