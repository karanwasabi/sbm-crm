import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SurveyResultsView } from '@/components/views/survey-results-view';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getSurvey, getSurveyResults, listSurveyOtherAnswers } from '@/utils/api';

export default async function FeedbackSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let survey;
  let results;
  let otherAnswers;
  try {
    [survey, results, otherAnswers] = await Promise.all([
      getSurvey(id),
      getSurveyResults(id),
      listSurveyOtherAnswers(id, { limit: 50, offset: 0 }),
    ]);
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-brand/10 bg-linear-to-r from-brand/10 via-white to-lilac/25 px-4 py-3.5 shadow-[0_16px_32px_-24px_rgba(92,101,207,0.55)]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">In-app survey</p>
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-800">{survey.title}</h1>
        </div>
        <Link
          href="/feedback"
          className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand/5"
        >
          All surveys
        </Link>
      </div>
      <SurveyResultsView survey={survey} initialResults={results} initialOtherAnswers={otherAnswers} />
    </CrmPageLayout>
  );
}
