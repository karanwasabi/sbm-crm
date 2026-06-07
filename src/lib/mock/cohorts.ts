import type { AttendanceRow, CohortCapacity } from '@/types/crm';

export const MOCK_COHORT_CAPACITY: CohortCapacity[] = [
  { name: 'Cohort A', color: '#5C65CF', week: 'Week 8', enrolled: 42, cap: 50, waitlist: 0, badge: 'Active' },
  { name: 'Cohort B', color: '#10B981', week: 'Week 4', enrolled: 38, cap: 50, waitlist: 3 },
  { name: 'Cohort C', color: '#8338EC', week: 'Week 1', enrolled: 28, cap: 40, waitlist: 12, badge: 'New' },
  { name: 'Cohort D', color: '#FFB703', week: 'Starts Jun 15', enrolled: 18, cap: 40, waitlist: 0 },
];

export const MOCK_ATTENDANCE: AttendanceRow[] = [
  { name: 'Anjali Reddy', cohort: 'Cohort C', sessions: 4, total: 5, pct: 80, status: 'On track' },
  { name: 'Rohan Kapur', cohort: 'Cohort A', sessions: 5, total: 5, pct: 100, status: 'Excellent' },
  { name: 'Priya Verma', cohort: 'Cohort B', sessions: 3, total: 5, pct: 60, status: 'At risk' },
  { name: 'Kabir Singh', cohort: 'Cohort C', sessions: 5, total: 5, pct: 100, status: 'Excellent' },
  { name: 'Nisha Kothari', cohort: 'Cohort B', sessions: 2, total: 5, pct: 40, status: 'At risk' },
];

export const MOCK_CALENDAR_DAYS = [
  { day: 1, label: '', events: 0 },
  { day: 2, label: '', events: 0 },
  { day: 3, label: '', events: 1 },
  { day: 4, label: '', events: 0 },
  { day: 5, label: 'Cohort C start', events: 1 },
  { day: 6, label: '', events: 0 },
  { day: 7, label: '', events: 0 },
  { day: 8, label: '', events: 0 },
  { day: 9, label: '', events: 0 },
  { day: 10, label: '', events: 1 },
  { day: 11, label: '', events: 0 },
  { day: 12, label: 'Cohort D opens', events: 1 },
  { day: 13, label: '', events: 0 },
  { day: 14, label: '', events: 0 },
  { day: 15, label: 'Cohort D start', events: 1 },
];
