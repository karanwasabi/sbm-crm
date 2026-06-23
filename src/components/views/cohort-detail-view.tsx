'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Pencil } from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
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

type CohortDetailViewProps = {
  cohort: CohortDetail;
  members: CohortMember[];
  transferTargets: CohortSummary[];
};

function MemberTable({
  title,
  subtitle,
  rows,
  deemphasized,
  showTransfer,
  onRowClick,
  onTransfer,
}: {
  title: string;
  subtitle: string;
  rows: CohortMember[];
  deemphasized?: boolean;
  showTransfer?: boolean;
  onRowClick: (member: CohortMember) => void;
  onTransfer: (member: CohortMember) => void;
}) {
  return (
    <Card padding="none" className={cn(deemphasized && 'opacity-75')}>
      <div className="p-5">
        <SectionHead title={title} subtitle={subtitle} />
      </div>
      <DataTable>
        <DataTableHead>
          {['Member', 'Phase', 'Status', 'Enrolled', ...(showTransfer ? [''] : [])].map((header) => (
            <DataTableHeaderCell key={header || 'actions'}>{header}</DataTableHeaderCell>
          ))}
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={showTransfer ? 5 : 4} className="py-10 text-center text-sm text-slate-500">
                No members in this section.
              </DataTableCell>
            </DataTableRow>
          ) : (
            rows.map((member) => (
              <DataTableRow key={member.enrollmentId} onClick={member.leadId ? () => onRowClick(member) : undefined}>
                <DataTableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                      {member.memberInitials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{member.memberName}</div>
                      <div className="text-[11px] text-slate-500">{member.email}</div>
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>{member.memberPhase}</DataTableCell>
                <DataTableCell>
                  <Pill tone={member.subscriptionState === 'active' ? 'success' : 'neutral'}>
                    {member.subscriptionState === 'active' ? 'Active' : 'Lapsed'}
                  </Pill>
                </DataTableCell>
                <DataTableCell className="text-slate-600">
                  {new Date(member.enrolledAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </DataTableCell>
                {showTransfer && (
                  <DataTableCell className="text-right">
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

function CohortDetailHeader({
  cohort,
  memberCount,
  onEdit,
}: {
  cohort: CohortDetail;
  memberCount: number;
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px] border-b-[6px] bg-linear-to-br px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]',
        cohortHeaderAccent(cohort.status)
      )}
    >
      <div aria-hidden className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
      <div className="relative z-1 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full border-b-2 border-black/20 bg-black/18 px-3 py-1.25 text-[10px] font-bold tracking-[0.14em] uppercase">
            {cohort.phaseLabel}
          </span>
          <h1 className="mt-3 text-[26px] font-extrabold tracking-tight">{cohort.name}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-sm font-medium text-white/92">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Starts {formatCohortStartDateLong(cohort.startsOn)}
            </span>
            <span className="text-white/75">{cohort.programName}</span>
            <span className="text-white/75">
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        {cohort.canEdit && (
          <Button
            variant="light"
            size="sm"
            className="shrink-0"
            onClick={onEdit}
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
          >
            Edit cohort
          </Button>
        )}
      </div>
    </div>
  );
}

export function CohortDetailView({ cohort, members, transferTargets }: CohortDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<CohortMember | null>(null);

  const activeMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'active'), [members]);
  const lapsedMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'lapsed'), [members]);

  const canTransfer = cohort.status === 'active' && transferTargets.length > 0;

  return (
    <CrmPageLayout className="space-y-5">
      <Link
        href="/programs"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to cohorts
      </Link>

      <CohortDetailHeader cohort={cohort} memberCount={members.length} onEdit={() => setEditOpen(true)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card padding="sm" className="p-4">
          <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Active</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{activeMembers.length}</div>
          <p className="mt-1 text-xs text-slate-500">Live subscription with access</p>
        </Card>
        <Card padding="sm" className="p-4">
          <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Lapsed</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{lapsedMembers.length}</div>
          <p className="mt-1 text-xs text-slate-500">Never paid, cancelled, halted, or expired</p>
        </Card>
      </div>

      <div className="space-y-4">
        <MemberTable
          title="Active subscriptions"
          subtitle={`${activeMembers.length} member${activeMembers.length === 1 ? '' : 's'} with live access`}
          rows={activeMembers}
          showTransfer={canTransfer}
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={setTransferMember}
        />
        <MemberTable
          title="Lapsed"
          subtitle="Cancelled, halted, or expired members"
          rows={lapsedMembers}
          deemphasized
          onRowClick={(member) => member.leadId && router.push(`/customers/${member.leadId}`)}
          onTransfer={() => undefined}
        />
      </div>

      <CohortEditDialog cohort={cohort} open={editOpen} onOpenChange={setEditOpen} />
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
