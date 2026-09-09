'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CategoricalBarChart } from '@/components/crm/charts/categorical-bar-chart';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { getSurveyResults, listSurveyOtherAnswers } from '@/utils/api';
import type {
  SurveyDetail,
  SurveyOtherAnswer,
  SurveyOtherAnswersList,
  SurveyQuestionResult,
  SurveyResults,
} from '@/utils/api';

const OTHER_PAGE_SIZE = 50;

type SurveyResultsViewProps = {
  survey: SurveyDetail;
  initialResults: SurveyResults;
  initialOtherAnswers: SurveyOtherAnswersList;
};

function formatPrompt(prompt: string): string {
  return prompt.replace(/\\n/g, '\n').replace(/\n+/g, ' ').trim();
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function SurveyResultsView({ survey, initialResults, initialOtherAnswers }: SurveyResultsViewProps) {
  const [cohortIds, setCohortIds] = useState<string[]>([]);
  const [dayIndex, setDayIndex] = useState<number>(survey.days[0]?.day_index ?? 1);
  const [results, setResults] = useState(initialResults);
  const [otherAnswers, setOtherAnswers] = useState(initialOtherAnswers);
  const [otherQuestionId, setOtherQuestionId] = useState<string>('');
  const [otherDayIndex, setOtherDayIndex] = useState<number | ''>('');
  const [otherPage, setOtherPage] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [othersLoading, setOthersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipInitialResultsFetch = useRef(true);
  const skipInitialOthersFetch = useRef(true);

  const questionsWithOther = useMemo(
    () => survey.questions.filter((q) => q.options.some((opt) => opt.allows_other)),
    [survey.questions]
  );

  const dayQuestions = useMemo(
    () => results.questions.filter((q) => q.day_index === dayIndex),
    [results.questions, dayIndex]
  );

  const reloadResults = useCallback(
    async (nextCohortIds: string[]) => {
      setResultsLoading(true);
      setError(null);
      try {
        const next = await getSurveyResults(survey.id, nextCohortIds);
        setResults(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results.');
      } finally {
        setResultsLoading(false);
      }
    },
    [survey.id]
  );

  const reloadOthers = useCallback(
    async (opts: { cohortIds: string[]; dayIndex: number | ''; questionId: string; page: number }) => {
      setOthersLoading(true);
      setError(null);
      try {
        const next = await listSurveyOtherAnswers(survey.id, {
          cohortIds: opts.cohortIds,
          dayIndex: opts.dayIndex === '' ? undefined : opts.dayIndex,
          questionId: opts.questionId || undefined,
          limit: OTHER_PAGE_SIZE,
          offset: opts.page * OTHER_PAGE_SIZE,
        });
        setOtherAnswers(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Other answers.');
      } finally {
        setOthersLoading(false);
      }
    },
    [survey.id]
  );

  useEffect(() => {
    if (skipInitialResultsFetch.current) {
      skipInitialResultsFetch.current = false;
      return;
    }
    void reloadResults(cohortIds);
  }, [cohortIds, reloadResults]);

  useEffect(() => {
    if (skipInitialOthersFetch.current) {
      skipInitialOthersFetch.current = false;
      return;
    }
    void reloadOthers({
      cohortIds,
      dayIndex: otherDayIndex,
      questionId: otherQuestionId,
      page: otherPage,
    });
  }, [cohortIds, otherDayIndex, otherQuestionId, otherPage, reloadOthers]);

  function toggleCohort(id: string) {
    setCohortIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    setOtherPage(0);
  }

  const otherPageCount = Math.max(1, Math.ceil(otherAnswers.total / OTHER_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHead
          title="Overview"
          subtitle={`${formatDate(survey.starts_on)} – ${formatDate(survey.ends_on)} · ${survey.status}`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Respondents" value={results.respondent_count} />
          <Kpi label="Answers" value={results.answer_count} />
          <Kpi label="Other free-text" value={results.other_text_count} />
          <Kpi
            label="Day completions"
            value={results.day_completions.reduce((sum, day) => sum + day.completion_count, 0)}
          />
        </div>

        {survey.cohorts.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Cohorts</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCohortIds([]);
                  setOtherPage(0);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  cohortIds.length === 0 ? 'bg-brand text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                All cohorts
              </button>
              {survey.cohorts.map((cohort) => {
                const active = cohortIds.includes(cohort.id);
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => toggleCohort(cohort.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      active ? 'bg-brand text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {cohort.name}
                    {cohort.is_demo ? ' (demo)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {results.day_completions.map((day) => (
            <div key={day.day_index} className="rounded-2xl border border-slate-100 bg-canvas-cool px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-500">
                Day {day.day_index}: {day.title}
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-800 tabular-nums">
                {day.completion_count.toLocaleString('en-IN')} completions
              </p>
            </div>
          ))}
        </div>
        {resultsLoading ? <p className="mt-3 text-xs font-medium text-brand">Refreshing results…</p> : null}
        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}
      </Card>

      <Card>
        <SectionHead title="Answer distributions" subtitle="Select a survey day to inspect each question" />
        <div className="mb-4 flex flex-wrap gap-2">
          {survey.days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setDayIndex(day.day_index)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                dayIndex === day.day_index ? 'bg-brand text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Day {day.day_index}: {day.title}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {dayQuestions.map((question) => (
            <QuestionChartCard key={question.question_id} question={question} />
          ))}
        </div>
        {dayQuestions.length === 0 ? <p className="text-sm text-slate-500">No questions for this day.</p> : null}
      </Card>

      <Card>
        <SectionHead
          title="Other free-text answers"
          subtitle={`${otherAnswers.total.toLocaleString('en-IN')} subjective answers`}
          right={
            questionsWithOther.length > 0 ? (
              <Pill tone="brand">{questionsWithOther.length} questions allow Other</Pill>
            ) : null
          }
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            value={otherDayIndex === '' ? '' : String(otherDayIndex)}
            onChange={(event) => {
              setOtherDayIndex(event.target.value ? Number(event.target.value) : '');
              setOtherPage(0);
            }}
          >
            <option value="">All days</option>
            {survey.days.map((day) => (
              <option key={day.id} value={day.day_index}>
                Day {day.day_index}: {day.title}
              </option>
            ))}
          </select>
          <select
            className="max-w-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            value={otherQuestionId}
            onChange={(event) => {
              setOtherQuestionId(event.target.value);
              setOtherPage(0);
            }}
          >
            <option value="">All Other questions</option>
            {questionsWithOther.map((question) => (
              <option key={question.id} value={question.id}>
                Day {question.day_index}: {formatPrompt(question.prompt)}
              </option>
            ))}
          </select>
        </div>

        {othersLoading ? <p className="mb-3 text-xs font-medium text-brand">Loading Other answers…</p> : null}

        {otherAnswers.items.length === 0 ? (
          <p className="text-sm text-slate-500">No Other free-text answers match these filters.</p>
        ) : (
          <>
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Member</DataTableHeaderCell>
                <DataTableHeaderCell>Question</DataTableHeaderCell>
                <DataTableHeaderCell>Other answer</DataTableHeaderCell>
                <DataTableHeaderCell>Answered</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {otherAnswers.items.map((row) => (
                  <OtherAnswerRow key={`${row.user_id}-${row.question_id}-${row.answered_on}`} row={row} />
                ))}
              </DataTableBody>
            </DataTable>

            {otherAnswers.total > OTHER_PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Page {otherPage + 1} of {otherPageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="light"
                    size="sm"
                    disabled={otherPage === 0 || othersLoading}
                    onClick={() => setOtherPage((value) => value - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    disabled={otherPage + 1 >= otherPageCount || othersLoading}
                    onClick={() => setOtherPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-800 tabular-nums">{value.toLocaleString('en-IN')}</p>
    </div>
  );
}

function QuestionChartCard({ question }: { question: SurveyQuestionResult }) {
  const items = [
    ...question.option_counts.map((opt) => ({
      id: opt.option_id,
      label: opt.label,
      count: opt.count,
    })),
  ];
  if (question.allows_na) {
    items.push({
      id: '__na__',
      label: question.na_label || 'N/A',
      count: question.na_count,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <CategoricalBarChart title={formatPrompt(question.prompt)} items={items} />
      {question.other_text_count > 0 ? (
        <p className="px-1 text-xs font-medium text-slate-500">
          {question.other_text_count.toLocaleString('en-IN')} Other free-text answer
          {question.other_text_count === 1 ? '' : 's'} — see table below
        </p>
      ) : null}
    </div>
  );
}

function OtherAnswerRow({ row }: { row: SurveyOtherAnswer }) {
  return (
    <DataTableRow>
      <DataTableCell>
        {row.lead_id ? (
          <Link href={`/customers/${row.lead_id}`} className="font-semibold text-brand hover:underline">
            {row.member_name}
          </Link>
        ) : (
          <span className="font-semibold text-slate-800">{row.member_name}</span>
        )}
        {row.member_email ? <p className="mt-0.5 text-xs text-slate-500">{row.member_email}</p> : null}
      </DataTableCell>
      <DataTableCell>
        <p className="text-xs font-semibold text-slate-500">
          Day {row.day_index}: {row.day_title}
        </p>
        <p className="mt-0.5 text-sm text-slate-800">{formatPrompt(row.question_prompt)}</p>
      </DataTableCell>
      <DataTableCell>
        <p className="text-sm whitespace-pre-wrap text-slate-800">{row.other_text}</p>
      </DataTableCell>
      <DataTableCell>{formatDate(row.answered_on)}</DataTableCell>
    </DataTableRow>
  );
}
