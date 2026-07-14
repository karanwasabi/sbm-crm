'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Pencil, UserRound } from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CohortAssignCoachDialog } from '@/components/programs/cohort-assign-coach-dialog';
import { CohortDefaultCoachDialog } from '@/components/programs/cohort-default-coach-dialog';
import { CohortEditDialog } from '@/components/programs/cohort-edit-dialog';
import { CohortTransferDialog } from '@/components/programs/cohort-transfer-dialog';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { cohortHeaderAccent, formatCohortStartDateLong } from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortDetail, CohortMember, CohortSummary } from '@/types/crm';
import type { StaffMember } from '@/utils/api';

type CohortDetailViewProps = {
  cohort: CohortDetail;
  members: CohortMember[];
  transferTargets: CohortSummary[];
  coaches: StaffMember[];
};

function MemberTableColGroup({ withActions }: { withActions: boolean }) {
  if (withActions) {
    return (
      <colgroup>
        <col style={{ width: '6%' }} />
        <col style={{ width: '34%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '16%' }} />
        <col style={{ width: '12%' }} />
      </colgroup>
    );
  }

  return (
    <colgroup>
      <col style={{ width: '6%' }} />
      <col style={{ width: '38%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '20%' }} />
    </colgroup>
  );
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
          {['Member', 'Status', 'Coach', 'Enrolled', ...(transferColumn ? [''] : [])].map((header) => (
            <DataTableHeaderCell key={header || 'actions'} className={header === '' ? 'text-right' : undefined}>
              {header}
            </DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={columnCount} className="py-10 text-center text-sm text-slate-500">
                No members in this section.
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
                  <Pill tone={member.subscriptionState === 'active' ? 'success' : 'neutral'}>
                    {member.subscriptionState === 'active' ? 'Active' : 'Lapsed'}
                  </Pill>
                </DataTableCell>
                <DataTableCell className="truncate text-slate-600">{member.coachName ?? '—'}</DataTableCell>
                <DataTableCell className="text-slate-600">
                  {new Date(member.enrolledAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
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

export function CohortDetailView({ cohort, members, transferTargets, coaches }: CohortDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [defaultCoachOpen, setDefaultCoachOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<CohortMember | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'active'), [members]);
  const lapsedMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'lapsed'), [members]);

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

      {selectedList.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">
            {selectedList.length} member{selectedList.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAssignOpen(true)}>
              Assign coach
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <MemberTable
          title="Active subscriptions"
          subtitle={`${activeMembers.length} member${activeMembers.length === 1 ? '' : 's'} with live access`}
          rows={activeMembers}
          transferColumn={canTransfer}
          showTransfer={canTransfer}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={setTransferMember}
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
