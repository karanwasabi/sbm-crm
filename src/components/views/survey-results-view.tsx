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
import { getSurveyResultsAction, listSurveyOtherAnswersAction } from '@/app/(crm)/feedback/actions';
import { cn } from '@/lib/cn';
import type {
  SurveyDetail,
  SurveyOtherAnswer,
  SurveyOtherAnswersList,
  SurveyQuestionResult,
  SurveyResults,
} from '@/lib/survey-types';

const OTHER_PAGE_SIZE = 50;

const KPI_STYLES = [
  {
    card: 'border-brand/15 bg-linear-to-br from-brand/10 via-brand-glow-soft/40 to-white',
    label: 'text-brand-deep/70',
    value: 'text-brand-deep',
  },
  {
    card: 'border-emerald-200/80 bg-linear-to-br from-emerald-50 via-teal-50/60 to-white',
    label: 'text-emerald-800/70',
    value: 'text-emerald-900',
  },
  {
    card: 'border-amber-200/80 bg-linear-to-br from-amber-50 via-motivation/20 to-white',
    label: 'text-amber-800/70',
    value: 'text-amber-950',
  },
  {
    card: 'border-violet-200/80 bg-linear-to-br from-violet-50 via-lilac/30 to-white',
    label: 'text-violet-800/70',
    value: 'text-violet-950',
  },
] as const;

const DAY_CHIP_STYLES = [
  'border-sky-200 bg-sky-50 text-sky-900',
  'border-emerald-200 bg-emerald-50 text-emerald-900',
  'border-amber-200 bg-amber-50 text-amber-950',
  'border-violet-200 bg-violet-50 text-violet-950',
  'border-rose-200 bg-rose-50 text-rose-900',
  'border-teal-200 bg-teal-50 text-teal-900',
] as const;

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

function statusLabel(status: string): string {
  if (status === 'active') return 'Active';
  if (status === 'draft') return 'Draft';
  if (status === 'closed') return 'Closed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function SurveyResultsView({ survey, initialResults, initialOtherAnswers }: SurveyResultsViewProps) {
  const liveCohorts = useMemo(() => survey.cohorts.filter((cohort) => !cohort.is_demo), [survey.cohorts]);
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
      const result = await getSurveyResultsAction(survey.id, nextCohortIds);
      if (result.error || !result.data) {
        setError(result.error ?? 'Unable to refresh results.');
      } else {
        setResults(result.data);
      }
      setResultsLoading(false);
    },
    [survey.id]
  );

  const reloadOthers = useCallback(
    async (opts: { cohortIds: string[]; dayIndex: number | ''; questionId: string; page: number }) => {
      setOthersLoading(true);
      setError(null);
      const result = await listSurveyOtherAnswersAction(survey.id, {
        cohortIds: opts.cohortIds,
        dayIndex: opts.dayIndex === '' ? undefined : opts.dayIndex,
        questionId: opts.questionId || undefined,
        limit: OTHER_PAGE_SIZE,
        offset: opts.page * OTHER_PAGE_SIZE,
      });
      if (result.error || !result.data) {
        setError(result.error ?? 'Unable to load written responses.');
      } else {
        setOtherAnswers(result.data);
      }
      setOthersLoading(false);
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
  const totalDayCompletions = results.day_completions.reduce((sum, day) => sum + day.completion_count, 0);

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden border-brand/10 bg-linear-to-br from-white via-canvas-cool to-brand-glow-soft/30 shadow-[0_18px_40px_-28px_rgba(92,101,207,0.45)]">
        <SectionHead
          title="Summary"
          subtitle={`${formatDate(survey.starts_on)} – ${formatDate(survey.ends_on)} · ${statusLabel(survey.status)}`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Respondents" value={results.respondent_count} style={KPI_STYLES[0]} />
          <Kpi label="Total answers" value={results.answer_count} style={KPI_STYLES[1]} />
          <Kpi label="Written responses" value={results.other_text_count} style={KPI_STYLES[2]} />
          <Kpi label="Day completions" value={totalDayCompletions} style={KPI_STYLES[3]} />
        </div>

        {liveCohorts.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Cohorts</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCohortIds([]);
                  setOtherPage(0);
                }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                  cohortIds.length === 0
                    ? 'bg-brand text-white shadow-[0_8px_16px_-8px_rgba(92,101,207,0.7)]'
                    : 'border border-slate-200 bg-white/90 text-slate-700 hover:border-brand/30 hover:bg-brand/5'
                )}
              >
                All live cohorts
              </button>
              {liveCohorts.map((cohort) => {
                const active = cohortIds.includes(cohort.id);
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => toggleCohort(cohort.id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                      active
                        ? 'bg-brand text-white shadow-[0_8px_16px_-8px_rgba(92,101,207,0.7)]'
                        : 'border border-slate-200 bg-white/90 text-slate-700 hover:border-brand/30 hover:bg-brand/5'
                    )}
                  >
                    {cohort.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {results.day_completions.map((day, index) => (
            <div
              key={day.day_index}
              className={cn(
                'rounded-2xl border px-3.5 py-3 shadow-sm',
                DAY_CHIP_STYLES[index % DAY_CHIP_STYLES.length]
              )}
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase opacity-70">Day {day.day_index}</p>
              <p className="mt-0.5 truncate text-sm font-bold">{day.title}</p>
              <p className="mt-2 text-lg font-extrabold tabular-nums">
                {day.completion_count.toLocaleString('en-IN')}
                <span className="ml-1 text-xs font-semibold opacity-70">completions</span>
              </p>
            </div>
          ))}
        </div>
        {resultsLoading ? <p className="mt-3 text-xs font-medium text-brand">Refreshing results…</p> : null}
        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}
      </Card>

      <Card className="border-emerald-100/80 bg-linear-to-br from-white to-emerald-50/40">
        <SectionHead title="Response breakdown" subtitle="Select a survey day to review each question" />
        <div className="mb-4 flex flex-wrap gap-2">
          {survey.days.map((day, index) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setDayIndex(day.day_index)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                dayIndex === day.day_index
                  ? 'bg-emerald-600 text-white shadow-[0_8px_16px_-8px_rgba(5,150,105,0.65)]'
                  : cn('border bg-white/80 hover:brightness-95', DAY_CHIP_STYLES[index % DAY_CHIP_STYLES.length])
              )}
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

      <Card className="border-amber-100/80 bg-linear-to-br from-white to-amber-50/35">
        <SectionHead
          title="Written responses"
          subtitle={`${otherAnswers.total.toLocaleString('en-IN')} open-ended answers from live cohorts`}
          right={
            questionsWithOther.length > 0 ? (
              <Pill tone="brand">{questionsWithOther.length} questions allow Other</Pill>
            ) : null
          }
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="rounded-full border border-amber-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
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
            className="max-w-xs rounded-full border border-amber-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            value={otherQuestionId}
            onChange={(event) => {
              setOtherQuestionId(event.target.value);
              setOtherPage(0);
            }}
          >
            <option value="">All questions with Other</option>
            {questionsWithOther.map((question) => (
              <option key={question.id} value={question.id}>
                Day {question.day_index}: {formatPrompt(question.prompt)}
              </option>
            ))}
          </select>
        </div>

        {othersLoading ? <p className="mb-3 text-xs font-medium text-brand">Loading written responses…</p> : null}

        {otherAnswers.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-sm text-slate-600">
            No written responses match these filters.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-amber-100/80 bg-white/90 shadow-sm">
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Member</DataTableHeaderCell>
                  <DataTableHeaderCell>Question</DataTableHeaderCell>
                  <DataTableHeaderCell>Response</DataTableHeaderCell>
                  <DataTableHeaderCell>Answered</DataTableHeaderCell>
                </DataTableHead>
                <DataTableBody>
                  {otherAnswers.items.map((row) => (
                    <OtherAnswerRow key={`${row.user_id}-${row.question_id}-${row.answered_on}`} row={row} />
                  ))}
                </DataTableBody>
              </DataTable>
            </div>

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

function Kpi({ label, value, style }: { label: string; value: number; style: (typeof KPI_STYLES)[number] }) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3.5 shadow-sm', style.card)}>
      <p className={cn('text-xs font-semibold', style.label)}>{label}</p>
      <p className={cn('mt-1 text-2xl font-extrabold tracking-tight tabular-nums', style.value)}>
        {value.toLocaleString('en-IN')}
      </p>
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
      <CategoricalBarChart title={formatPrompt(question.prompt)} items={items} colorful />
      {question.other_text_count > 0 ? (
        <p className="rounded-xl bg-amber-50/80 px-2.5 py-1.5 text-xs font-medium text-amber-900/80">
          {question.other_text_count.toLocaleString('en-IN')} written response
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
        <p className="rounded-xl bg-amber-50/70 px-2.5 py-2 text-sm whitespace-pre-wrap text-slate-800">
          {row.other_text}
        </p>
      </DataTableCell>
      <DataTableCell>{formatDate(row.answered_on)}</DataTableCell>
    </DataTableRow>
  );
}
