'use client';

import type { ReactNode } from 'react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { ResponsiveList } from '@/components/crm/responsive-list';
import { StarBalanceLines } from '@/components/crm/star-balance-lines';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { cn } from '@/lib/cn';
import { formatTrialDate, formatTrialDaysLeft, trialStateLabel } from '@/lib/trial-cohort-display';
import type { CohortMember, CohortMemberTrialState } from '@/types/crm';

function TrialStatusPill({ state }: { state: CohortMemberTrialState | undefined }) {
  if (state === 'pending') return <Pill tone="warn">Pending</Pill>;
  if (state === 'active') return <Pill tone="success">Active</Pill>;
  if (state === 'lapsed') return <Pill tone="neutral">Ended</Pill>;
  return <Pill tone="neutral">{trialStateLabel(state)}</Pill>;
}

export function TrialMemberTable({
  title,
  subtitle,
  rows,
  deemphasized,
  selectedIds,
  onToggle,
  onToggleAll,
  onRowClick,
  emptyMessage,
  toolbar,
}: {
  title: string;
  subtitle: string;
  rows: CohortMember[];
  deemphasized?: boolean;
  selectedIds: Set<string>;
  onToggle: (enrollmentId: string) => void;
  onToggleAll: (ids: string[], selected: boolean) => void;
  onRowClick: (member: CohortMember) => void;
  emptyMessage?: string;
  toolbar?: ReactNode;
}) {
  const columnCount = 9;
  const rowIds = rows.map((row) => row.enrollmentId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));

  return (
    <Card padding="none" className={cn('overflow-hidden', deemphasized && 'opacity-75')}>
      <div className="px-5 pt-3 pb-2.5">
        <SectionHead title={title} subtitle={subtitle} className="mb-1.5" />
      </div>
      {toolbar}
      <ResponsiveList
        mobile={
          rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {emptyMessage ?? 'No members in this section.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-3 pb-3">
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleAll(rowIds, event.target.checked)}
                  aria-label={`Select all in ${title}`}
                />
                <span className="text-[11px] font-semibold text-slate-500">Select page</span>
              </div>
              {rows.map((member) => (
                <button
                  key={member.enrollmentId}
                  type="button"
                  disabled={!member.leadId}
                  onClick={member.leadId ? () => onRowClick(member) : undefined}
                  className={cn(
                    'rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm',
                    !member.leadId && 'cursor-default'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-brand"
                      checked={selectedIds.has(member.enrollmentId)}
                      onChange={() => onToggle(member.enrollmentId)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${member.memberName}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                          {member.memberInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{member.memberName}</p>
                          <p className="truncate text-[12px] text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <TrialStatusPill state={member.trialState} />
                        {member.onboardingCompletedAt ? (
                          <Pill tone="success">Onboarded</Pill>
                        ) : (
                          <Pill tone="warn">Onboarding</Pill>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-slate-600">
                        <span>Duration: {member.trialDurationDays != null ? `${member.trialDurationDays}d` : '—'}</span>
                        <span>Days left: {formatTrialDaysLeft(member)}</span>
                        <span>Start: {formatTrialDate(member.trialStartsOn)}</span>
                        <span>End: {formatTrialDate(member.trialEndsOn)}</span>
                      </div>
                      {member.whatsapp ? (
                        <p className="mt-2 truncate text-[12px] text-slate-600">{member.whatsapp}</p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        }
        desktop={
          <div className="overflow-x-auto">
            <DataTable tableClassName="min-w-[1100px]">
              <colgroup>
                <col style={{ minWidth: 40 }} />
                <col style={{ minWidth: 220 }} />
                <col style={{ minWidth: 100 }} />
                <col style={{ minWidth: 90 }} />
                <col style={{ minWidth: 110 }} />
                <col style={{ minWidth: 110 }} />
                <col style={{ minWidth: 90 }} />
                <col style={{ minWidth: 110 }} />
                <col style={{ minWidth: 120 }} />
              </colgroup>
              <DataTableHead>
                <DataTableHeaderCell>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => onToggleAll(rowIds, event.target.checked)}
                    aria-label={`Select all in ${title}`}
                  />
                </DataTableHeaderCell>
                <DataTableHeaderCell>Member</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Duration</DataTableHeaderCell>
                <DataTableHeaderCell>Start</DataTableHeaderCell>
                <DataTableHeaderCell>End</DataTableHeaderCell>
                <DataTableHeaderCell>Days left</DataTableHeaderCell>
                <DataTableHeaderCell>Onboarding</DataTableHeaderCell>
                <DataTableHeaderCell>Stars</DataTableHeaderCell>
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
                    <DataTableRow
                      key={member.enrollmentId}
                      onClick={member.leadId ? () => onRowClick(member) : undefined}
                    >
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
                            {member.whatsapp ? (
                              <div className="truncate text-[11px] text-slate-500">{member.whatsapp}</div>
                            ) : null}
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <TrialStatusPill state={member.trialState} />
                      </DataTableCell>
                      <DataTableCell className="text-slate-600 tabular-nums">
                        {member.trialDurationDays != null ? `${member.trialDurationDays} days` : '—'}
                      </DataTableCell>
                      <DataTableCell className="text-slate-600">
                        {member.trialState === 'pending' ? '—' : formatTrialDate(member.trialStartsOn)}
                      </DataTableCell>
                      <DataTableCell className="text-slate-600">
                        {member.trialState === 'pending' ? '—' : formatTrialDate(member.trialEndsOn)}
                      </DataTableCell>
                      <DataTableCell className="text-slate-600 tabular-nums">
                        {formatTrialDaysLeft(member)}
                      </DataTableCell>
                      <DataTableCell>
                        {member.onboardingCompletedAt ? (
                          <Pill tone="success">Complete</Pill>
                        ) : (
                          <Pill tone="warn">Incomplete</Pill>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <StarBalanceLines
                          earned={member.starsEarned}
                          available={member.starsAvailable}
                          value={member.starsValue}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </div>
        }
      />
    </Card>
  );
}
