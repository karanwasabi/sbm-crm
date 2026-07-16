'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, CalendarDays, Pencil, UserRound } from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { LeadTableTimestamp } from '@/components/crm/lead-timestamp';
import { CohortAssignCoachDialog } from '@/components/programs/cohort-assign-coach-dialog';
import { CohortBulkSendButton } from '@/components/programs/cohort-bulk-send-button';
import { CohortDefaultCoachDialog } from '@/components/programs/cohort-default-coach-dialog';
import { CohortEditDialog } from '@/components/programs/cohort-edit-dialog';
import { CohortTransferDialog } from '@/components/programs/cohort-transfer-dialog';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { StagePill } from '@/components/ui/stage-pill';
import { cohortHeaderAccent, formatCohortStartDateLong } from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortDetail, CohortMember, CohortSummary, LifecycleStage } from '@/types/crm';
import type { EmailTemplate, StaffMember } from '@/utils/api';

type CohortDetailViewProps = {
  cohort: CohortDetail;
  members: CohortMember[];
  transferTargets: CohortSummary[];
  coaches: StaffMember[];
  emailTemplates: EmailTemplate[];
};

type ActiveSortKey = 'name' | 'coach' | 'enrolled';
type SortOrder = 'asc' | 'desc';

const STATUS_FILTER_OPTIONS = [
  { id: 'newbie', label: 'Newbie' },
  { id: 'member', label: 'Member' },
] as const;

const LIFECYCLE_STAGE_IDS = new Set<string>([
  'inquiry',
  'engaged',
  'registered',
  'newbie',
  'member',
  'grace',
  'lapsed',
  'lost',
]);

function isLifecycleStage(value: string): value is LifecycleStage {
  return LIFECYCLE_STAGE_IDS.has(value);
}

function MemberTableColGroup({ withActions }: { withActions: boolean }) {
  if (withActions) {
    return (
      <colgroup>
        <col style={{ width: '6%' }} />
        <col style={{ width: '32%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '12%' }} />
      </colgroup>
    );
  }

  return (
    <colgroup>
      <col style={{ width: '6%' }} />
      <col style={{ width: '36%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '22%' }} />
    </colgroup>
  );
}

function LocalSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
}: {
  label: string;
  sortKey: ActiveSortKey;
  activeKey: ActiveSortKey;
  order: SortOrder;
  onSort: (key: ActiveSortKey) => void;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-brand',
        active ? 'text-brand' : 'text-slate-600'
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ActiveMemberStatus({ member }: { member: CohortMember }) {
  const stage = member.lifecycleStage?.trim();
  if (!stage) return <span className="text-slate-400">—</span>;
  if (isLifecycleStage(stage)) return <StagePill stage={stage} />;
  return <Pill tone="neutral">{stage.charAt(0).toUpperCase() + stage.slice(1)}</Pill>;
}

function MemberTable({
  title,
  subtitle,
  rows,
  deemphasized,
  transferColumn,
  showTransfer,
  selectedIds,
  onToggle,
  onToggleAll,
  onRowClick,
  onTransfer,
  sortable,
  sortKey,
  sortOrder,
  onSort,
  emptyMessage,
  statusMode,
}: {
  title: string;
  subtitle: string;
  rows: CohortMember[];
  deemphasized?: boolean;
  transferColumn: boolean;
  showTransfer?: boolean;
  selectedIds: Set<string>;
  onToggle: (enrollmentId: string) => void;
  onToggleAll: (ids: string[], selected: boolean) => void;
  onRowClick: (member: CohortMember) => void;
  onTransfer: (member: CohortMember) => void;
  sortable?: boolean;
  sortKey?: ActiveSortKey;
  sortOrder?: SortOrder;
  onSort?: (key: ActiveSortKey) => void;
  emptyMessage?: string;
  statusMode: 'lifecycle' | 'lapsed';
}) {
  const columnCount = transferColumn ? 6 : 5;
  const rowIds = rows.map((row) => row.enrollmentId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));

  return (
    <Card padding="none" className={cn('overflow-hidden', deemphasized && 'opacity-75')}>
      <div className="px-5 pt-3 pb-2.5">
        <SectionHead title={title} subtitle={subtitle} className="mb-1.5" />
      </div>
      <DataTable tableClassName="table-fixed">
        <MemberTableColGroup withActions={transferColumn} />
        <DataTableHead>
          <DataTableHeaderCell>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => onToggleAll(rowIds, event.target.checked)}
              aria-label={`Select all in ${title}`}
            />
          </DataTableHeaderCell>
          <DataTableHeaderCell>
            {sortable && sortKey && sortOrder && onSort ? (
              <LocalSortableHeader
                label="Member"
                sortKey="name"
                activeKey={sortKey}
                order={sortOrder}
                onSort={onSort}
              />
            ) : (
              'Member'
            )}
          </DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>
            {sortable && sortKey && sortOrder && onSort ? (
              <LocalSortableHeader
                label="Coach"
                sortKey="coach"
                activeKey={sortKey}
                order={sortOrder}
                onSort={onSort}
              />
            ) : (
              'Coach'
            )}
          </DataTableHeaderCell>
          <DataTableHeaderCell>
            {sortable && sortKey && sortOrder && onSort ? (
              <LocalSortableHeader
                label="Enrolled"
                sortKey="enrolled"
                activeKey={sortKey}
                order={sortOrder}
                onSort={onSort}
              />
            ) : (
              'Enrolled'
            )}
          </DataTableHeaderCell>
          {transferColumn ? <DataTableHeaderCell className="text-right">{'\u00a0'}</DataTableHeaderCell> : null}
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={columnCount} className="py-10 text-center text-sm text-slate-500">
                {emptyMessage ?? 'No members in this section.'}
              </DataTableCell>
            </DataTableRow>
          ) : (
            rows.map((member) => (
              <DataTableRow key={member.enrollmentId} onClick={member.leadId ? () => onRowClick(member) : undefined}>
                <DataTableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(member.enrollmentId)}
                    onChange={() => onToggle(member.enrollmentId)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${member.memberName}`}
                  />
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                      {member.memberInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-800">{member.memberName}</div>
                      <div className="truncate text-[11px] text-slate-500">{member.email}</div>
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  {statusMode === 'lapsed' ? (
                    <Pill tone="neutral">Lapsed</Pill>
                  ) : (
                    <ActiveMemberStatus member={member} />
                  )}
                </DataTableCell>
                <DataTableCell className="truncate text-slate-600">{member.coachName ?? '—'}</DataTableCell>
                <DataTableCell className="text-slate-600">
                  <LeadTableTimestamp iso={member.enrolledAt} />
                </DataTableCell>
                {transferColumn && (
                  <DataTableCell className="text-right">
                    {showTransfer ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          onTransfer(member);
                        }}
                      >
                        Transfer
                      </Button>
                    ) : null}
                  </DataTableCell>
                )}
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}

function CohortHeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-20 flex-col items-center px-5 py-2.5 sm:min-w-24 sm:px-6 sm:py-3">
      <div className="text-2xl font-extrabold tracking-tight text-white tabular-nums sm:text-[26px]">
        {value.toLocaleString('en-IN')}
      </div>
      <div className="mt-0.5 text-[9px] font-bold tracking-[0.16em] text-white/75 uppercase">{label}</div>
    </div>
  );
}

function CohortDetailHeader({
  cohort,
  activeCount,
  lapsedCount,
}: {
  cohort: CohortDetail;
  activeCount: number;
  lapsedCount: number;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px] border-b-[6px] bg-linear-to-br px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]',
        cohortHeaderAccent(cohort.status)
      )}
    >
      <div aria-hidden className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
      <div className="relative z-1 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-extrabold tracking-tight">{cohort.name}</h1>
            <span className="inline-flex items-center rounded-full border-b-2 border-black/20 bg-black/18 px-3 py-1.25 text-[10px] font-bold tracking-[0.14em] uppercase">
              {cohort.phaseLabel}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-white/92">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 shrink-0" />
              Starts {formatCohortStartDateLong(cohort.startsOn)}
            </span>
            <span className="text-white/75">{cohort.programName}</span>
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <UserRound className="h-3 w-3 shrink-0" />
              Default coach: {cohort.defaultCoachName?.trim() || 'None'}
            </span>
          </div>
        </div>

        <div className="inline-flex shrink-0 overflow-hidden rounded-2xl border-b-2 border-black/22 bg-black/16 sm:self-center">
          <CohortHeaderStat label="Active" value={activeCount} />
          <div className="w-px self-stretch bg-white/20" aria-hidden />
          <CohortHeaderStat label="Lapsed" value={lapsedCount} />
        </div>
      </div>
    </div>
  );
}

function CoachSummaryTable({ members }: { members: CohortMember[] }) {
  const rows = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const member of members) {
      if (!member.coachUserId) continue;
      const existing = counts.get(member.coachUserId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(member.coachUserId, {
          name: member.coachName?.trim() || member.coachUserId,
          count: 1,
        });
      }
    }
    return Array.from(counts.entries())
      .map(([id, row]) => ({ id, name: row.name, count: row.count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
  }, [members]);

  if (rows.length === 0) return null;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 pt-3 pb-2.5">
        <SectionHead title="Coaches" subtitle="Assigned student counts in this cohort" className="mb-1.5" />
      </div>
      <DataTable>
        <DataTableHead>
          <DataTableHeaderCell>Coach</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Students</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {rows.map((row) => (
            <DataTableRow key={row.id}>
              <DataTableCell className="font-semibold text-slate-800">{row.name}</DataTableCell>
              <DataTableCell className="text-right text-slate-600 tabular-nums">{row.count}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}

function toggleInList(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function compareMembers(a: CohortMember, b: CohortMember, sortKey: ActiveSortKey, order: SortOrder): number {
  const direction = order === 'asc' ? 1 : -1;
  if (sortKey === 'name') {
    return a.memberName.localeCompare(b.memberName, undefined, { sensitivity: 'base' }) * direction;
  }
  if (sortKey === 'coach') {
    const aCoach = a.coachName?.trim() || '';
    const bCoach = b.coachName?.trim() || '';
    if (!aCoach && !bCoach) return 0;
    if (!aCoach) return order === 'asc' ? 1 : -1;
    if (!bCoach) return order === 'asc' ? -1 : 1;
    return aCoach.localeCompare(bCoach, undefined, { sensitivity: 'base' }) * direction;
  }
  const aTime = new Date(a.enrolledAt).getTime();
  const bTime = new Date(b.enrolledAt).getTime();
  return (aTime - bTime) * direction;
}

export function CohortDetailView({ cohort, members, transferTargets, coaches, emailTemplates }: CohortDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [defaultCoachOpen, setDefaultCoachOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<CohortMember | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [coachFilters, setCoachFilters] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<ActiveSortKey>('enrolled');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const activeMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'active'), [members]);
  const lapsedMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'lapsed'), [members]);

  const coachFilterOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const member of activeMembers) {
      if (!member.coachUserId) continue;
      options.set(member.coachUserId, member.coachName?.trim() || member.coachUserId);
    }
    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [activeMembers]);

  const filteredActiveMembers = useMemo(() => {
    return activeMembers.filter((member) => {
      if (statusFilters.length > 0) {
        const stage = member.lifecycleStage?.trim() || '';
        if (!statusFilters.includes(stage)) return false;
      }
      if (coachFilters.length > 0) {
        const coachId = member.coachUserId || 'unassigned';
        if (!coachFilters.includes(coachId)) return false;
      }
      return true;
    });
  }, [activeMembers, coachFilters, statusFilters]);

  const sortedActiveMembers = useMemo(() => {
    return [...filteredActiveMembers].sort((a, b) => compareMembers(a, b, sortKey, sortOrder));
  }, [filteredActiveMembers, sortKey, sortOrder]);

  const filtersActive = statusFilters.length > 0 || coachFilters.length > 0;
  const canTransfer = cohort.status === 'active' && transferTargets.length > 0;
  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const toggle = (enrollmentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  };

  const toggleAll = (ids: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleSort = (key: ActiveSortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortOrder(key === 'enrolled' ? 'desc' : 'asc');
  };

  return (
    <CrmPageLayout className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/programs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to cohorts
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="light" size="sm" onClick={() => setDefaultCoachOpen(true)}>
            Default coach
          </Button>
          {cohort.canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditOpen(true)}
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
            >
              Edit cohort
            </Button>
          )}
        </div>
      </div>

      <CohortDetailHeader cohort={cohort} activeCount={activeMembers.length} lapsedCount={lapsedMembers.length} />

      <CoachSummaryTable members={members} />

      {selectedList.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">
            {selectedList.length} member{selectedList.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <CohortBulkSendButton members={members} selectedEnrollmentIds={selectedList} templates={emailTemplates} />
            <Button variant="primary" size="sm" onClick={() => setAssignOpen(true)}>
              Assign coach
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Status</span>
          {STATUS_FILTER_OPTIONS.map((option) => {
            const active = statusFilters.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilters((prev) => toggleInList(prev, option.id))}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {option.label}
              </button>
            );
          })}
          <span className="ml-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Coach</span>
          <button
            type="button"
            onClick={() => setCoachFilters((prev) => toggleInList(prev, 'unassigned'))}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              coachFilters.includes('unassigned')
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            Unassigned
          </button>
          {coachFilterOptions.map((option) => {
            const active = coachFilters.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCoachFilters((prev) => toggleInList(prev, option.id))}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {option.name}
              </button>
            );
          })}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilters([]);
                setCoachFilters([]);
              }}
              className="ml-auto text-xs font-semibold text-brand"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <MemberTable
          title="Active subscriptions"
          subtitle={`${activeMembers.length} member${activeMembers.length === 1 ? '' : 's'} with live access`}
          rows={sortedActiveMembers}
          transferColumn={canTransfer}
          showTransfer={canTransfer}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={setTransferMember}
          sortable
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage={filtersActive ? 'No active members match the current filters.' : 'No members in this section.'}
          statusMode="lifecycle"
        />
        <MemberTable
          title="Lapsed"
          subtitle="Cancelled, halted, or expired members"
          rows={lapsedMembers}
          deemphasized
          transferColumn={canTransfer}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={() => undefined}
          statusMode="lapsed"
        />
      </div>

      <CohortEditDialog cohort={cohort} open={editOpen} onOpenChange={setEditOpen} />
      <CohortDefaultCoachDialog
        cohort={cohort}
        coaches={coaches}
        open={defaultCoachOpen}
        onOpenChange={setDefaultCoachOpen}
      />
      <CohortAssignCoachDialog
        cohortId={cohort.id}
        enrollmentIds={selectedList}
        coaches={coaches}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => setSelectedIds(new Set())}
      />
      <CohortTransferDialog
        cohortId={cohort.id}
        member={transferMember}
        targets={transferTargets}
        open={transferMember !== null}
        onOpenChange={(open) => {
          if (!open) setTransferMember(null);
        }}
      />
    </CrmPageLayout>
  );
}
