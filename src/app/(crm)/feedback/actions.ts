'use server';

import { getSurveyResults, listSurveyOtherAnswers, ApiError } from '@/utils/api';
import type { SurveyOtherAnswersList, SurveyResults } from '@/lib/survey-types';

export async function getSurveyResultsAction(
  surveyId: string,
  cohortIds: string[] = []
): Promise<{ data: SurveyResults | null; error: string | null }> {
  try {
    const data = await getSurveyResults(surveyId, cohortIds);
    return { data, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load survey results.';
    return { data: null, error: message };
  }
}

export async function listSurveyOtherAnswersAction(
  surveyId: string,
  options?: { cohortIds?: string[]; dayIndex?: number; questionId?: string; limit?: number; offset?: number }
): Promise<{ data: SurveyOtherAnswersList | null; error: string | null }> {
  try {
    const data = await listSurveyOtherAnswers(surveyId, options);
    return { data, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load Other answers.';
    return { data: null, error: message };
  }
}
