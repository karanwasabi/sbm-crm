'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { UserRoundPlus } from 'lucide-react';
import { assignCohortCoachAction } from '@/app/(crm)/programs/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { balanceCoachAssignments } from '@/lib/balance-coach-assignments';
import { cn } from '@/lib/cn';
import type { CohortMember } from '@/types/crm';
import type { StaffMember } from '@/utils/api';

type CohortAutoAssignCoachesDialogProps = {
  cohortId: string;
  members: CohortMember[];
  coaches: StaffMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function coachOptionLabel(coach: StaffMember) {
  const name = [coach.first_name, coach.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} · ${coach.email}` : coach.email;
}

export function CohortAutoAssignCoachesDialog({
  cohortId,
  members,
  coaches,
  open,
  onOpenChange,
}: CohortAutoAssignCoachesDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
  }, [open]);

  const selectedCoaches = useMemo(
    () => coaches.filter((coach) => selectedIds.includes(coach.user_id)),
    [coaches, selectedIds]
  );

  const plan = useMemo(() => balanceCoachAssignments({ members, selectedCoaches }), [members, selectedCoaches]);

  const unassignedCount = useMemo(
    () => members.filter((member) => member.subscriptionState === 'active' && !member.coachUserId).length,
    [members]
  );

  const groupsToApply = plan.assignments.filter((row) => row.newEnrollmentIds.length > 0);
  const canApply = !pending && selectedIds.length > 0 && unassignedCount > 0 && groupsToApply.length > 0;

  const toggleCoach = (coachUserId: string) => {
    setSelectedIds((prev) =>
      prev.includes(coachUserId) ? prev.filter((id) => id !== coachUserId) : [...prev, coachUserId]
    );
  };

  const selectAll = () => setSelectedIds(coaches.map((coach) => coach.user_id));
  const clearAll = () => setSelectedIds([]);

  const submit = () => {
    if (!canApply) return;

    startTransition(async () => {
      let updatedTotal = 0;
      try {
        for (const group of groupsToApply) {
          const result = await assignCohortCoachAction(cohortId, group.newEnrollmentIds, group.coachUserId);
          updatedTotal += result.updated;
        }
        toast({
          message: `Auto-assigned coaches to ${updatedTotal} member${updatedTotal === 1 ? '' : 's'}`,
          variant: 'success',
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Could not auto-assign coaches.',
          variant: 'error',
        });
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Auto-assign coaches</DialogTitle>
          <DialogDescription>
            Choose coaches, then balance {unassignedCount} unassigned active member
            {unassignedCount === 1 ? '' : 's'} across them.
          </DialogDescription>
        </DialogHeader>

        {coaches.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-canvas-cool px-4 py-6 text-center text-sm text-slate-500">
            No coaches available in the system.
          </p>
        ) : unassignedCount === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-canvas-cool px-4 py-6 text-center text-sm text-slate-500">
            Every active member already has a coach.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">
                {unassignedCount} unassigned · {selectedIds.length} coach
                {selectedIds.length === 1 ? '' : 'es'} selected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={pending}
                  className="text-xs font-semibold text-brand disabled:opacity-50"
                >
                  Select all
                </button>
                {selectedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={pending}
                    className="text-xs font-semibold text-slate-500 disabled:opacity-50"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-2">
              {coaches.map((coach) => {
                const checked = selectedIds.includes(coach.user_id);
                const currentLoad = members.filter((member) => member.coachUserId === coach.user_id).length;
                return (
                  <label
                    key={coach.user_id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      checked ? 'bg-brand/5' : 'hover:bg-canvas-cool'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCoach(coach.user_id)}
                      disabled={pending}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                      {coachOptionLabel(coach)}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-400 tabular-nums">
                      {currentLoad} now
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedIds.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Preview</p>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-canvas-cool text-left text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                        <th className="px-3 py-2">Coach</th>
                        <th className="px-3 py-2 text-right">Load</th>
                        <th className="px-3 py-2 text-right">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.assignments.map((row) => (
                        <tr key={row.coachUserId} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{row.coachName}</td>
                          <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
                            {row.currentLoad} → {row.projectedLoad}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800 tabular-nums">
                            +{row.newEnrollmentIds.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select at least one coach to see the balanced plan.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={pending}
            disabled={!canApply}
            leftIcon={<UserRoundPlus className="h-3.5 w-3.5" />}
          >
            Auto assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
