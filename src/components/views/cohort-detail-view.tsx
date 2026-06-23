'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
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
import { formatCohortStartDateLong, phasePillTone } from '@/lib/cohort-display';
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

export function CohortDetailView({ cohort, members, transferTargets }: CohortDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<CohortMember | null>(null);

  const activeMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'active'), [members]);
  const lapsedMembers = useMemo(() => members.filter((member) => member.subscriptionState === 'lapsed'), [members]);

  const canTransfer = cohort.status === 'active' && transferTargets.length > 0;

  return (
    <CrmPageLayout>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.push('/programs')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All cohorts
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{cohort.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {cohort.programName} · starts {formatCohortStartDateLong(cohort.startsOn)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={phasePillTone(cohort.phaseLabel)}>{cohort.phaseLabel}</Pill>
          {cohort.canEdit && (
            <Button variant="light" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="sm" className="p-4">
          <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Members</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{cohort.memberCount}</div>
        </Card>
        <Card padding="sm" className="p-4">
          <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Active subscriptions</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{activeMembers.length}</div>
        </Card>
        <Card padding="sm" className="p-4">
          <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Paid enrollments</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{cohort.paidMemberCount}</div>
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
