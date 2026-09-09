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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">{survey.title}</h1>
        <Link
          href="/feedback"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <SurveyResultsView survey={survey} initialResults={results} initialOtherAnswers={otherAnswers} />
    </CrmPageLayout>
  );
}
