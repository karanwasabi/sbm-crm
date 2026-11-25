'use server';

import { revalidatePath } from 'next/cache';
import {
  cancelLifestyleAuditBooking,
  getLifestyleAuditReassignOptions,
  listLifestyleAuditBookings,
  putLifestyleAuditSchedule,
  reassignLifestyleAuditBooking,
  syncLifestyleAuditBookingCalendar,
} from '@/utils/api';

export async function saveLifestyleAuditScheduleAction(input: {
  operatingWeekdays: number[];
  slots: Array<{
    localTime: string;
    sortOrder?: number;
    isActive?: boolean;
    coachUserIds: string[];
  }>;
}) {
  const result = await putLifestyleAuditSchedule(input);
  revalidatePath('/lifestyle-audit');
  return result;
}

export async function loadLifestyleAuditBookingsAction(params?: {
  from?: string;
  to?: string;
  status?: string;
  coachUserId?: string;
  limit?: number;
  offset?: number;
}) {
  return listLifestyleAuditBookings(params);
}

export async function cancelLifestyleAuditBookingAction(id: string) {
  const result = await cancelLifestyleAuditBooking(id);
  revalidatePath('/lifestyle-audit');
  return result;
}

export async function syncLifestyleAuditBookingCalendarAction(id: string) {
  const result = await syncLifestyleAuditBookingCalendar(id);
  revalidatePath('/lifestyle-audit');
  return result;
}

export async function loadLifestyleAuditReassignOptionsAction(id: string) {
  return getLifestyleAuditReassignOptions(id);
}

export async function reassignLifestyleAuditBookingAction(id: string, coachUserId: string) {
  const result = await reassignLifestyleAuditBooking(id, coachUserId);
  revalidatePath('/lifestyle-audit');
  return result;
}
