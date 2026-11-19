import { shiftCalendarDate } from '@/lib/ist-datetime';

export type RevenueAmountBlock = {
  basePaise: number;
  gstPaise: number;
  discountPaise: number;
  starsPaise: number;
  totalPaise: number;
  studentCount: number;
  paymentCount: number;
};

export type RevenueSplitCell = {
  class: string;
  plan: string;
  amounts: RevenueAmountBlock;
};

export type RevenueSourceRow = {
  source: string;
  amounts: RevenueAmountBlock;
};

export type RevenueStudentRow = {
  userId: string;
  leadId?: string | null;
  email: string;
  fullName: string;
  firstPurchaseAt: string;
  lifetimePaidPaise: number;
  purchaseCount: number;
  monthsWithUs: number;
  status: string;
};

export type RevenueJoiningMonthRow = {
  joinMonth: string;
  cohortSize: number;
  returnedByMonth3: number;
  returnedByMonth6: number;
  returnedByMonth12: number;
  avgLifetimePaidPaise: number;
};

export type RevenueFailuresBlock = {
  failedCheckoutsCount: number;
  failedCheckoutsPaise: number;
  failedChargesCount: number;
  failedChargesPaise: number;
  offlineRefundsCount: number;
  paymentFailedEventsCount: number;
};

export type RevenueAnalytics = {
  timezone: string;
  since: string;
  until: string;
  split: RevenueSplitCell[];
  newbieSources: RevenueSourceRow[];
  students: RevenueStudentRow[];
  studentTotal: number;
  studentOffset: number;
  studentLimit: number;
  joiningMonths: RevenueJoiningMonthRow[];
  failures: RevenueFailuresBlock;
};

export type RevenueWindow = {
  since: string;
  until: string;
};

const EMPTY_AMOUNTS: RevenueAmountBlock = {
  basePaise: 0,
  gstPaise: 0,
  discountPaise: 0,
  starsPaise: 0,
  totalPaise: 0,
  studentCount: 0,
  paymentCount: 0,
};

export const EMPTY_REVENUE_ANALYTICS: RevenueAnalytics = {
  timezone: 'Asia/Kolkata',
  since: '',
  until: '',
  split: [],
  newbieSources: [],
  students: [],
  studentTotal: 0,
  studentOffset: 0,
  studentLimit: 50,
  joiningMonths: [],
  failures: {
    failedCheckoutsCount: 0,
    failedCheckoutsPaise: 0,
    failedChargesCount: 0,
    failedChargesPaise: 0,
    offlineRefundsCount: 0,
    paymentFailedEventsCount: 0,
  },
};

function mapAmounts(raw: Record<string, unknown> | undefined): RevenueAmountBlock {
  if (!raw) return { ...EMPTY_AMOUNTS };
  return {
    basePaise: Number(raw.base_paise ?? 0),
    gstPaise: Number(raw.gst_paise ?? 0),
    discountPaise: Number(raw.discount_paise ?? 0),
    starsPaise: Number(raw.stars_paise ?? 0),
    totalPaise: Number(raw.total_paise ?? 0),
    studentCount: Number(raw.student_count ?? 0),
    paymentCount: Number(raw.payment_count ?? 0),
  };
}

export function mapRevenueAnalytics(payload: Record<string, unknown>): RevenueAnalytics {
  const split = Array.isArray(payload.split) ? payload.split : [];
  const sources = Array.isArray(payload.newbie_sources) ? payload.newbie_sources : [];
  const students = Array.isArray(payload.students) ? payload.students : [];
  const joining = Array.isArray(payload.joining_months) ? payload.joining_months : [];
  const failures = (payload.failures ?? {}) as Record<string, unknown>;

  return {
    timezone: String(payload.timezone ?? 'Asia/Kolkata'),
    since: String(payload.since ?? ''),
    until: String(payload.until ?? ''),
    split: split.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        class: String(r.class ?? ''),
        plan: String(r.plan ?? ''),
        amounts: mapAmounts(r.amounts as Record<string, unknown>),
      };
    }),
    newbieSources: sources.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        source: String(r.source ?? ''),
        amounts: mapAmounts(r.amounts as Record<string, unknown>),
      };
    }),
    students: students.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        userId: String(r.user_id ?? ''),
        leadId: r.lead_id ? String(r.lead_id) : null,
        email: String(r.email ?? ''),
        fullName: String(r.full_name ?? ''),
        firstPurchaseAt: String(r.first_purchase_at ?? ''),
        lifetimePaidPaise: Number(r.lifetime_paid_paise ?? 0),
        purchaseCount: Number(r.purchase_count ?? 0),
        monthsWithUs: Number(r.months_with_us ?? 0),
        status: String(r.status ?? ''),
      };
    }),
    studentTotal: Number(payload.student_total ?? 0),
    studentOffset: Number(payload.student_offset ?? 0),
    studentLimit: Number(payload.student_limit ?? 50),
    joiningMonths: joining.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        joinMonth: String(r.join_month ?? ''),
        cohortSize: Number(r.cohort_size ?? 0),
        returnedByMonth3: Number(r.returned_by_month_3 ?? 0),
        returnedByMonth6: Number(r.returned_by_month_6 ?? 0),
        returnedByMonth12: Number(r.returned_by_month_12 ?? 0),
        avgLifetimePaidPaise: Number(r.avg_lifetime_paid_paise ?? 0),
      };
    }),
    failures: {
      failedCheckoutsCount: Number(failures.failed_checkouts_count ?? 0),
      failedCheckoutsPaise: Number(failures.failed_checkouts_paise ?? 0),
      failedChargesCount: Number(failures.failed_charges_count ?? 0),
      failedChargesPaise: Number(failures.failed_charges_paise ?? 0),
      offlineRefundsCount: Number(failures.offline_refunds_count ?? 0),
      paymentFailedEventsCount: Number(failures.payment_failed_events_count ?? 0),
    },
  };
}

export function classLabel(value: string): string {
  switch (value) {
    case 'newbie':
      return 'Newbie';
    case 'renewal':
      return 'Renewal';
    case 'returning':
      return 'Returning';
    default:
      return value;
  }
}

export function sourceLabel(value: string): string {
  switch (value) {
    case 'ads':
      return 'Ads';
    case 'referral':
      return 'Referral';
    case 'coach_handle':
      return "Coach's handle";
    case 'webinar':
      return 'Webinar';
    case 'old_leads':
      return 'Old leads';
    case 'quad':
      return 'Quad';
    case 'seo':
      return 'SEO';
    default:
      return value;
  }
}

export function planLabel(value: string): string {
  if (value === 'other') return 'Other';
  return `${value}-month`;
}

/** Default last 30 IST calendar days as [since, until) RFC3339. */
export function defaultRevenueWindow(now = new Date()): RevenueWindow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const sinceDay = shiftCalendarDate(today, -29);
  const untilExclusive = shiftCalendarDate(today, 1);
  return {
    since: `${sinceDay}T00:00:00+05:30`,
    until: `${untilExclusive}T00:00:00+05:30`,
  };
}

export function parseRevenueWindowParams(params: Record<string, string | string[] | undefined>): RevenueWindow {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const since = get('since')?.trim() ?? '';
  const until = get('until')?.trim() ?? '';
  if (since && until) return { since, until };
  return defaultRevenueWindow();
}

export function buildRevenueSearchParams(
  window: RevenueWindow,
  opts?: { studentOffset?: number; studentLimit?: number }
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('since', window.since);
  params.set('until', window.until);
  if (opts?.studentOffset != null) params.set('student_offset', String(opts.studentOffset));
  if (opts?.studentLimit != null) params.set('student_limit', String(opts.studentLimit));
  return params;
}
