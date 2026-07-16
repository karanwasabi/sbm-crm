import type { CohortMember } from '@/types/crm';
import type { StaffMember } from '@/utils/api';

export type BalanceCoachInput = {
  members: CohortMember[];
  selectedCoaches: StaffMember[];
};

export type CoachAssignmentPreview = {
  coachUserId: string;
  coachName: string;
  currentLoad: number;
  projectedLoad: number;
  newEnrollmentIds: string[];
};

export type BalanceCoachResult = {
  unassignedCount: number;
  assignments: CoachAssignmentPreview[];
  /** enrollment_id → coach_user_id */
  byEnrollmentId: Map<string, string>;
};

function coachDisplayName(coach: StaffMember): string {
  const name = [coach.first_name, coach.last_name].filter(Boolean).join(' ').trim();
  return name || coach.email;
}

function compareCoaches(a: { load: number; name: string; id: string }, b: { load: number; name: string; id: string }) {
  if (a.load !== b.load) return a.load - b.load;
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  if (byName !== 0) return byName;
  return a.id.localeCompare(b.id);
}

/**
 * Distribute unassigned active members onto selected coaches so totals
 * (existing cohort load + new) stay as even as possible.
 */
export function balanceCoachAssignments({ members, selectedCoaches }: BalanceCoachInput): BalanceCoachResult {
  const selected = selectedCoaches.filter((coach) => Boolean(coach.user_id));
  if (selected.length === 0) {
    const unassignedCount = members.filter(
      (member) => member.subscriptionState === 'active' && !member.coachUserId
    ).length;
    return { unassignedCount, assignments: [], byEnrollmentId: new Map() };
  }

  const load = new Map<string, number>();
  const nameById = new Map<string, string>();
  for (const coach of selected) {
    load.set(coach.user_id, 0);
    nameById.set(coach.user_id, coachDisplayName(coach));
  }

  for (const member of members) {
    const coachId = member.coachUserId;
    if (!coachId || !load.has(coachId)) continue;
    load.set(coachId, (load.get(coachId) ?? 0) + 1);
  }

  const unassigned = members
    .filter((member) => member.subscriptionState === 'active' && !member.coachUserId)
    .slice()
    .sort((a, b) => a.memberName.localeCompare(b.memberName, undefined, { sensitivity: 'base' }));

  const newByCoach = new Map<string, string[]>();
  for (const coach of selected) {
    newByCoach.set(coach.user_id, []);
  }

  const byEnrollmentId = new Map<string, string>();
  for (const member of unassigned) {
    let best: { id: string; load: number; name: string } | null = null;
    for (const coach of selected) {
      const candidate = {
        id: coach.user_id,
        load: load.get(coach.user_id) ?? 0,
        name: nameById.get(coach.user_id) ?? coach.user_id,
      };
      if (!best || compareCoaches(candidate, best) < 0) {
        best = candidate;
      }
    }
    if (!best) continue;
    load.set(best.id, best.load + 1);
    newByCoach.get(best.id)?.push(member.enrollmentId);
    byEnrollmentId.set(member.enrollmentId, best.id);
  }

  const assignments: CoachAssignmentPreview[] = selected
    .map((coach) => {
      const newEnrollmentIds = newByCoach.get(coach.user_id) ?? [];
      const projectedLoad = load.get(coach.user_id) ?? 0;
      const currentLoad = projectedLoad - newEnrollmentIds.length;
      return {
        coachUserId: coach.user_id,
        coachName: nameById.get(coach.user_id) ?? coach.user_id,
        currentLoad,
        projectedLoad,
        newEnrollmentIds,
      };
    })
    .sort((a, b) => a.coachName.localeCompare(b.coachName, undefined, { sensitivity: 'base' }));

  return {
    unassignedCount: unassigned.length,
    assignments,
    byEnrollmentId,
  };
}
