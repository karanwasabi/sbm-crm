'use server';

import { buildLeadPayload, type LeadFormValues } from '@/lib/lead-form';
import type { CreateLeadState, IntakeDuplicateCheckResult, IntakeForm, UpsertIntakeFormInput } from '@/types/crm';
import {
  ApiError,
  archiveIntakeForm,
  checkIntakeDuplicate,
  createIntakeForm,
  createLead,
  mergeIntakeLead,
  updateIntakeForm,
} from '@/utils/api';

export async function checkManualLeadDuplicate(
  values: LeadFormValues
): Promise<{ ok: true; result: IntakeDuplicateCheckResult } | { ok: false; error: string }> {
  const firstName = values.firstName.trim();
  const email = values.email.trim().toLowerCase();
  if (!firstName || !email) {
    return { ok: false, error: 'First name and email are required.' };
  }

  try {
    const result = await checkIntakeDuplicate({
      first_name: firstName,
      ...(values.lastName.trim() ? { last_name: values.lastName.trim() } : {}),
      email,
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      ...(values.countryCode.trim() ? { country_code: values.countryCode.trim().toUpperCase() } : {}),
      ...(values.city.trim() ? { city: values.city.trim() } : {}),
    });
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to check duplicate.';
    return { ok: false, error: message };
  }
}

export async function mergeManualLeadIntake(
  values: LeadFormValues,
  targetLeadId: string,
  mode: 'profile' | 'attach_inquiry',
  applyFields: string[]
): Promise<{ error: string | null; leadId?: string }> {
  const built = buildLeadPayload(values);
  if (!built.ok) {
    return { error: built.error };
  }

  try {
    const lead = await mergeIntakeLead({
      target_lead_id: targetLeadId,
      mode,
      first_name: built.payload.first_name,
      last_name: built.payload.last_name,
      email: built.payload.email,
      phone: built.payload.phone,
      country_code: built.payload.country_code,
      city: built.payload.city,
      manual_source: built.payload.manual_source,
      manual_tags: built.payload.manual_tags,
      notes: built.payload.notes,
      apply_fields: applyFields,
    });
    return { error: null, leadId: lead.id };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to merge lead.';
    return { error: message };
  }
}

export async function createManualLead(
  values: LeadFormValues,
  options?: { forceSeparate?: boolean }
): Promise<CreateLeadState & { leadId?: string }> {
  const result = buildLeadPayload(values);
  if (!result.ok) {
    return { error: result.error, success: false };
  }

  try {
    const lead = await createLead({
      ...result.payload,
      ...(options?.forceSeparate ? { force_separate: true } : {}),
    });
    return { error: null, success: true, leadId: lead.id };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save lead.';
    return { error: message, success: false };
  }
}

export async function saveIntakeForm(
  input: UpsertIntakeFormInput,
  formId?: string
): Promise<{ error: string | null; form?: IntakeForm }> {
  try {
    const form = formId ? await updateIntakeForm(formId, input) : await createIntakeForm(input);
    return { error: null, form };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save intake form.';
    return { error: message };
  }
}

export async function archiveIntakeFormAction(formId: string): Promise<{ error: string | null; form?: IntakeForm }> {
  try {
    const form = await archiveIntakeForm(formId);
    return { error: null, form };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to archive intake form.';
    return { error: message };
  }
}
