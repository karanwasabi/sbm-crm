'use server';

import { ApiError, listCheckInSyncIssues, resolveCheckInSyncIssue, type CheckInSyncIssue } from '@/utils/api';

export async function listCheckInSyncIssuesAction(
  status?: string
): Promise<{ result: { count: number; issues: CheckInSyncIssue[] } | null; error: string | null }> {
  try {
    const result = await listCheckInSyncIssues(status);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load check-in sync issues.';
    return { result: null, error: message };
  }
}

export async function resolveCheckInSyncIssueAction(
  userId: string,
  localDate: string
): Promise<{ error: string | null }> {
  try {
    await resolveCheckInSyncIssue(userId, localDate);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to resolve issue.';
    return { error: message };
  }
}
