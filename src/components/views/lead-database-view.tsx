'use client';

import { useEffect, type ReactNode } from 'react';
import { FilterBar } from '@/components/crm/filter-bar';
import { LeadDatabaseSelectionProvider } from '@/components/crm/lead-database-selection-context';
import { LeadDatabaseActiveFilters } from '@/components/crm/lead-database-active-filters';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import { buildStageFilterOptions } from '@/lib/lead-display';
import type { LeadFilterOptions, LeadSummary, TagSuggestion } from '@/types/crm';

type LeadDatabaseViewProps = {
  filters: LeadDatabaseFilters;
  summary: LeadSummary;
  filterOptions: LeadFilterOptions;
  tagSuggestions: TagSuggestion[];
  children: ReactNode;
};

export function LeadDatabaseView({ filters, summary, filterOptions, tagSuggestions, children }: LeadDatabaseViewProps) {
  const { setLeadTotal } = useCrmLeadSummary();
  const stageOptions = buildStageFilterOptions(summary);

  useEffect(() => {
    setLeadTotal(summary.total);
    return () => setLeadTotal(null);
  }, [summary.total, setLeadTotal]);

  return (
    <LeadDatabaseSelectionProvider filters={filters}>
      <CrmPageLayout>
        <FilterBar
          filters={filters}
          stageOptions={stageOptions}
          filterOptions={filterOptions}
          tagSuggestions={tagSuggestions}
        />

        <LeadDatabaseActiveFilters filters={filters} />

        {children}
      </CrmPageLayout>
    </LeadDatabaseSelectionProvider>
  );
}
