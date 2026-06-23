'use server';

import { buildLeadPayload, type LeadFormValues } from '@/lib/lead-form';
import type { CreateLeadState, MetaCSVImportResult } from '@/types/crm';
import { ApiError, createLead, importMetaLeadsCSV } from '@/utils/api';

export async function createManualLead(values: LeadFormValues): Promise<CreateLeadState> {
  const result = buildLeadPayload(values);
  if (!result.ok) {
    return { error: result.error, success: false };
  }

  try {
    await createLead(result.payload);
    return { error: null, success: true };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save lead.';
    return { error: message, success: false };
  }
}

export async function importMetaLeadsCSVAction(file: File): Promise<MetaCSVImportResult> {
  return importMetaLeadsCSV(file);
}
