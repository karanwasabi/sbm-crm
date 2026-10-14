'use server';

import { revalidatePath } from 'next/cache';
import { createEvent, createEventSlot, updateEvent, updateEventSlot } from '@/utils/api';
import type { CreateEventInput, CreateEventSlotInput, UpdateEventInput, UpdateEventSlotInput } from '@/types/events';

export async function createEventAction(input: CreateEventInput) {
  const result = await createEvent(input);
  revalidatePath('/events');
  return result;
}

export async function updateEventAction(id: string, input: UpdateEventInput) {
  const result = await updateEvent(id, input);
  revalidatePath('/events');
  revalidatePath(`/events/${id}`);
  return result;
}

export async function createEventSlotAction(eventId: string, input: CreateEventSlotInput) {
  const result = await createEventSlot(eventId, input);
  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  return result;
}

export async function updateEventSlotAction(eventId: string, slotId: string, input: UpdateEventSlotInput) {
  const result = await updateEventSlot(eventId, slotId, input);
  revalidatePath(`/events/${eventId}`);
  return result;
}
