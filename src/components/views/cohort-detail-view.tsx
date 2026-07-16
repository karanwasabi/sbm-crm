'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowRightLeft,
  CalendarDays,
  MoreVertical,
  Pencil,
  UserRound,
  X,
} from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { LeadTableTimestamp } from '@/components/crm/lead-timestamp';
import { CohortAssignCoachDialog } from '@/components/programs/cohort-assign-coach-dialog';
import { CohortBulkSendButton } from '@/components/programs/cohort-bulk-send-button';
import { CohortEditDialog } from '@/components/programs/cohort-edit-dialog';
import { CohortTransferDialog } from '@/components/programs/cohort-transfer-dialog';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SectionHead } from '@/components/ui/section-head';
import { StagePill } from '@/components/ui/stage-pill';
import { cohortHeaderAccent, formatCohortStartDateLong } from '@/lib/cohort-display';
import { cn } from '@/lib/cn';
import type { CohortDetail, CohortMember, CohortSummary } from '@/types/crm';
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
  { id: 'renewal', label: 'Renewal' },
  { id: 'returnee', label: 'Returnee' },
  { id: 'member', label: 'Member' },
] as const;

type ActiveStatusId = (typeof STATUS_FILTER_OPTIONS)[number]['id'];

function activeMemberStatusId(member: CohortMember): ActiveStatusId {
  if (member.memberKind === 'returnee') return 'returnee';
  if (member.memberKind === 'renewal') return 'renewal';
  if (member.lifecycleStage?.trim() === 'newbie') return 'newbie';
  return 'member';
}

function MemberTableColGroup({ withActions }: { withActions: boolean }) {
  if (withActions) {
    return (
      <colgroup>
        <col style={{ width: '5%' }} />
        <col style={{ width: '36%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '20%' }} />
        <col style={{ width: '19%' }} />
        <col style={{ width: '6%' }} />
      </colgroup>
    );
  }

  return (
    <colgroup>
      <col style={{ width: '5%' }} />
      <col style={{ width: '38%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '22%' }} />
      <col style={{ width: '20%' }} />
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
  const status = activeMemberStatusId(member);
  if (status === 'returnee') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
        style={{ background: '#CCFBF1', color: '#0F766E' }}
      >
        <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: '#0F766E' }} />
        Returnee
      </span>
    );
  }
  if (status === 'renewal') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
        style={{ background: '#FFEDD5', color: '#C2410C' }}
      >
        <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: '#C2410C' }} />
        Renewal
      </span>
    );
  }
  if (status === 'newbie') return <StagePill stage="newbie" />;
  return <StagePill stage="member" />;
}

function MemberRowMenu({ onTransfer }: { onTransfer: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="More actions"
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <MoreVertical className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
          onClick={() => {
            setOpen(false);
            onTransfer();
          }}
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-brand" />
          Transfer
        </button>
      </PopoverContent>
    </Popover>
  );
}

function CohortCoachFilterPopover({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const selectedSet = useMemo(() => new Set(draft), [draft]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(selected);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(selected.length > 0)}>
        <UserRound className="h-3.5 w-3.5" />
        Coach{selected.length > 0 ? ` (${selected.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <p className="text-sm font-semibold text-slate-800">Filter by coach</p>
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No coaches yet.</p>
          ) : (
            options.map((option) => {
              const active = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                    active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                  )}
                  onClick={() =>
                    setDraft((current) =>
                      active ? current.filter((value) => value !== option.value) : [...current, option.value]
                    )
                  }
                >
                  <span className="truncate pr-2">{option.label}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
          {selected.length > 0 || draft.length > 0 ? (
            <Button
              variant="light"
              size="sm"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => {
                setDraft([]);
                onChange([]);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
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
  sortable,
  sortKey,
  sortOrder,
  onSort,
  emptyMessage,
  statusMode,
  toolbar,
  coachTones,
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
  toolbar?: ReactNode;
  coachTones: Map<string, (typeof COACH_PILL_TONES)[number]>;
}) {
  const columnCount = transferColumn ? 6 : 5;
  const rowIds = rows.map((row) => row.enrollmentId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));

  return (
    <Card padding="none" className={cn('overflow-hidden', deemphasized && 'opacity-75')}>
      <div className="px-5 pt-3 pb-2.5">
        <SectionHead title={title} subtitle={subtitle} className="mb-1.5" />
      </div>
      {toolbar}
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
                <DataTableCell>
                  <CoachNamePill name={member.coachName} coachUserId={member.coachUserId} tones={coachTones} />
                </DataTableCell>
                <DataTableCell className="text-slate-600">
                  <LeadTableTimestamp iso={member.enrolledAt} />
                </DataTableCell>
                {transferColumn ? (
                  <DataTableCell className="text-right">
                    {showTransfer ? <MemberRowMenu onTransfer={() => onTransfer(member)} /> : null}
                  </DataTableCell>
                ) : null}
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

/** Inspired by sbm-app nutrition category card gradients (c → p → deep). */
const COACH_CARD_GRADIENTS = [
  'from-[#16A34A] via-[#15803D] to-[#14532D]',
  'from-[#E11D48] via-[#BE123C] to-[#9F1239]',
  'from-[#D97706] via-[#B45309] to-[#92400E]',
  'from-[#818CF8] via-[#6366F1] to-[#4338CA]',
  'from-[#06B6D4] via-[#0891B2] to-[#155E75]',
  'from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]',
  'from-[#A18072] via-[#7C5A4A] to-[#57534E]',
] as const;

const COACH_PILL_TONES = [
  { color: '#15803D', tint: '#DCFCE7' },
  { color: '#BE123C', tint: '#FFE4E6' },
  { color: '#B45309', tint: '#FEF3C7' },
  { color: '#4F46E5', tint: '#E0E7FF' },
  { color: '#0E7490', tint: '#CFFAFE' },
  { color: '#6D28D9', tint: '#EDE9FE' },
  { color: '#7C5A4A', tint: '#E7E5E4' },
] as const;

function coachInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function rankedCoachRows(members: CohortMember[]) {
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
}

function coachToneById(members: CohortMember[]): Map<string, (typeof COACH_PILL_TONES)[number]> {
  const map = new Map<string, (typeof COACH_PILL_TONES)[number]>();
  rankedCoachRows(members).forEach((row, index) => {
    map.set(row.id, COACH_PILL_TONES[index % COACH_PILL_TONES.length]);
  });
  return map;
}

function CoachNamePill({
  name,
  coachUserId,
  tones,
}: {
  name?: string | null;
  coachUserId?: string | null;
  tones: Map<string, (typeof COACH_PILL_TONES)[number]>;
}) {
  const label = name?.trim();
  if (!label || !coachUserId) return <span className="text-slate-400">—</span>;
  const tone = tones.get(coachUserId);
  if (!tone) {
    return (
      <span className="inline-flex max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
      style={{ background: tone.tint, color: tone.color }}
      title={label}
    >
      <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: tone.color }} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function CoachSummaryCard({ members }: { members: CohortMember[] }) {
  const rows = useMemo(() => rankedCoachRows(members), [members]);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={cn(
            'relative min-w-[148px] overflow-hidden rounded-2xl border-b-[3px] border-black/25 bg-linear-to-br px-4 py-3.5 text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.35)]',
            COACH_CARD_GRADIENTS[index % COACH_CARD_GRADIENTS.length]
          )}
        >
          <div aria-hidden className="absolute -top-6 -right-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-1 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-extrabold tracking-wide text-white">
              {coachInitials(row.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-tight">{row.name}</p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-white/65 uppercase">Students</p>
              <p className="text-2xl font-extrabold tracking-tight tabular-nums">{row.count}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
    const counts = new Map<string, { label: string; count: number }>();
    let unassigned = 0;
    for (const member of activeMembers) {
      if (!member.coachUserId) {
        unassigned += 1;
        continue;
      }
      const existing = counts.get(member.coachUserId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(member.coachUserId, {
          label: member.coachName?.trim() || member.coachUserId,
          count: 1,
        });
      }
    }
    const named = Array.from(counts.entries())
      .map(([value, row]) => ({ value, label: row.label, count: row.count }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    return [{ value: 'unassigned', label: 'Unassigned', count: unassigned }, ...named];
  }, [activeMembers]);

  const coachLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of coachFilterOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [coachFilterOptions]);

  const filteredActiveMembers = useMemo(() => {
    return activeMembers.filter((member) => {
      if (statusFilters.length > 0) {
        if (!statusFilters.includes(activeMemberStatusId(member))) return false;
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

  const coachTones = useMemo(() => coachToneById(members), [members]);

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

  const toggleStatusFilter = (stageId: string) => {
    setStatusFilters((prev) => (prev.includes(stageId) ? prev.filter((item) => item !== stageId) : [...prev, stageId]));
  };

  const activeFilterToolbar = (
    <>
      <div className="flex flex-wrap items-center gap-2 border-y border-slate-100 bg-canvas-cool px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="mr-1 shrink-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Status</span>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              active={statusFilters.includes(option.id)}
              onClick={() => toggleStatusFilter(option.id)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
        <CohortCoachFilterPopover options={coachFilterOptions} selected={coachFilters} onChange={setCoachFilters} />
      </div>
      {filtersActive ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-brand/5 px-4 py-2">
          {statusFilters.map((stage) => (
            <ActiveFilterTag
              key={`status-${stage}`}
              label="Status"
              value={STATUS_FILTER_OPTIONS.find((option) => option.id === stage)?.label ?? stage}
              onDismiss={() => setStatusFilters((prev) => prev.filter((item) => item !== stage))}
            />
          ))}
          {coachFilters.map((coachId) => (
            <ActiveFilterTag
              key={`coach-${coachId}`}
              label="Coach"
              value={coachLabelById.get(coachId) ?? coachId}
              onDismiss={() => setCoachFilters((prev) => prev.filter((item) => item !== coachId))}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setStatusFilters([]);
              setCoachFilters([]);
            }}
            className="text-xs font-semibold text-brand"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </>
  );

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

      <CoachSummaryCard members={members} />

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
          toolbar={activeFilterToolbar}
          coachTones={coachTones}
        />
        <MemberTable
          title="Lapsed"
          subtitle="Cancelled, halted, or expired members"
          rows={lapsedMembers}
          deemphasized
          transferColumn={false}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={() => undefined}
          statusMode="lapsed"
          coachTones={coachTones}
        />
      </div>

      <CohortEditDialog cohort={cohort} open={editOpen} onOpenChange={setEditOpen} />
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
