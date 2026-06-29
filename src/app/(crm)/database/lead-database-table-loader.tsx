import { LeadDatabaseTableSection } from '@/components/views/lead-database-table-section';
import { listLeads } from '@/utils/api';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import type { LeadSummary } from '@/types/crm';

type LeadDatabaseTableLoaderProps = {
  filters: LeadDatabaseFilters;
  summary: LeadSummary;
};

export async function LeadDatabaseTableLoader({ filters, summary }: LeadDatabaseTableLoaderProps) {
  let listResult;
  let loadError: string | null = null;

  try {
    listResult = await listLeads(filters);
  } catch (error) {
    listResult = { items: [], total: 0, page: filters.page, pageSize: filters.pageSize, totalPages: 0 };
    loadError = error instanceof Error ? error.message : 'Failed to load leads.';
  }

  return <LeadDatabaseTableSection listResult={listResult} summary={summary} filters={filters} loadError={loadError} />;
}
