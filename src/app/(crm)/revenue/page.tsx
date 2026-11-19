import { RevenueDashboardView } from '@/components/views/revenue-dashboard-view';
import { buildRevenueSearchParams, EMPTY_REVENUE_ANALYTICS, parseRevenueWindowParams } from '@/lib/revenue-analytics';
import { ApiError, getRevenueAnalytics } from '@/utils/api';

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const window = parseRevenueWindowParams(params);
  const studentOffset = Number.parseInt(
    (Array.isArray(params.student_offset) ? params.student_offset[0] : params.student_offset) ?? '0',
    10
  );
  const studentLimit = Number.parseInt(
    (Array.isArray(params.student_limit) ? params.student_limit[0] : params.student_limit) ?? '50',
    10
  );
  const query = buildRevenueSearchParams(window, {
    studentOffset: Number.isFinite(studentOffset) ? Math.max(0, studentOffset) : 0,
    studentLimit: Number.isFinite(studentLimit) ? Math.max(1, studentLimit) : 50,
  }).toString();

  let data = { ...EMPTY_REVENUE_ANALYTICS, since: window.since, until: window.until };
  let loadError: string | null = null;
  try {
    data = await getRevenueAnalytics(query);
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : 'Failed to load revenue analytics.';
  }

  return <RevenueDashboardView data={data} window={window} loadError={loadError} />;
}
