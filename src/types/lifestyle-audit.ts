export type LifestyleAuditSettings = {
  pricePaise: number;
  durationMinutes: number;
  timezone: string;
  operatingWeekdays: number[];
  bookingHorizonDays: number;
  holdTtlMinutes: number;
  updatedAt?: string;
};

export type LifestyleAuditScheduleSlot = {
  localTime: string;
  sortOrder: number;
  isActive: boolean;
  coachUserIds: string[];
};

export type LifestyleAuditSchedule = {
  settings: LifestyleAuditSettings;
  slots: LifestyleAuditScheduleSlot[];
};

export type LifestyleAuditCoachOption = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type LifestyleAuditBooking = {
  id: string;
  leadId: string | null;
  fullName: string;
  email: string;
  whatsapp: string;
  slotDate: string;
  localTime: string;
  startsAt: string;
  endsAt: string;
  coachUserId: string;
  coachEmail: string;
  coachFirstName: string | null;
  coachLastName: string | null;
  status: string;
  amountPaise: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  holdExpiresAt: string | null;
  googleCalendarEventId: string | null;
  googleMeetLink: string | null;
  calendarSyncStatus: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type LifestyleAuditBookingsPage = {
  bookings: LifestyleAuditBooking[];
  total: number;
  limit: number;
  offset: number;
};
