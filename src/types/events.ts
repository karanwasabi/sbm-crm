export type EventStatus = 'draft' | 'published' | 'archived';

export const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export type EventSlot = {
  id: string;
  eventId: string;
  label: string;
  startsAt: string;
  sortOrder: number;
  isActive: boolean;
  registrationCount: number;
};

export type CrmEvent = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: EventStatus;
  publicUrl: string;
  registrationCount: number;
  slots: EventSlot[];
  createdAt: string;
  updatedAt: string;
};

export type EventRegistration = {
  id: string;
  eventId: string;
  slotId: string;
  slotLabel: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  lifecycleStage: string;
  createdAt: string;
  updatedAt: string;
};

export type EventOptionSlot = {
  id: string;
  label: string;
  startsAt: string;
};

export type EventOption = {
  id: string;
  name: string;
  slug: string;
  status: EventStatus;
  slots: EventOptionSlot[];
};

export type CreateEventInput = {
  name: string;
  slug?: string;
  description: string;
  status: EventStatus;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type CreateEventSlotInput = {
  label: string;
  startsAt: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateEventSlotInput = Partial<CreateEventSlotInput>;

export function eventStatusLabel(status: string): string {
  return EVENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function eventStatusTone(status: string): 'success' | 'neutral' | 'brand' {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'neutral';
  return 'brand';
}
