'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fetchAllFilteredLeads } from '@/lib/fetch-leads-client';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import type { Lead } from '@/types/crm';

export type PageSelectionState = 'none' | 'some' | 'all';

type LeadDatabaseSelectionContextValue = {
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggleLead: (lead: Lead) => void;
  togglePage: (leads: Lead[], checked: boolean) => void;
  pageSelectionState: (leads: Lead[]) => PageSelectionState;
  selectAllFiltered: (filters: LeadDatabaseFilters, filteredTotal: number) => void;
  clearSelection: () => void;
  getExportLeads: () => Lead[];
  needsPrefetchForExport: () => boolean;
  waitForPrefetch: () => Promise<Lead[] | null>;
  cancelPendingExport: () => void;
};

const LeadDatabaseSelectionContext = createContext<LeadDatabaseSelectionContextValue | null>(null);

function selectionKey(filters: LeadDatabaseFilters): string {
  return buildLeadDatabaseHref(filters);
}

export function LeadDatabaseSelectionProvider({
  filters,
  children,
}: {
  filters: LeadDatabaseFilters;
  children: ReactNode;
}) {
  const [explicitSelection, setExplicitSelection] = useState<Map<string, Lead>>(() => new Map());
  const [allFilteredActive, setAllFilteredActive] = useState(false);
  const [allFilteredCount, setAllFilteredCount] = useState(0);

  const prefetchGenerationRef = useRef(0);
  const prefetchLeadsRef = useRef<Map<string, Lead>>(new Map());
  const prefetchCompleteRef = useRef(false);
  const prefetchPromiseRef = useRef<Promise<void> | null>(null);
  const exportCancelRef = useRef(false);

  const filterKey = selectionKey(filters);

  const resetSelection = useCallback(() => {
    prefetchGenerationRef.current += 1;
    prefetchLeadsRef.current = new Map();
    prefetchCompleteRef.current = false;
    prefetchPromiseRef.current = null;
    exportCancelRef.current = true;
    setAllFilteredActive(false);
    setAllFilteredCount(0);
    setExplicitSelection(new Map());
  }, []);

  useEffect(() => {
    resetSelection();
  }, [filterKey, resetSelection]);

  const startPrefetch = useCallback((activeFilters: LeadDatabaseFilters, generation: number) => {
    prefetchCompleteRef.current = false;
    prefetchLeadsRef.current = new Map();

    const promise = fetchAllFilteredLeads(activeFilters)
      .then((leads) => {
        if (generation !== prefetchGenerationRef.current) {
          return;
        }
        prefetchLeadsRef.current = new Map(leads.map((lead) => [lead.id, lead]));
        prefetchCompleteRef.current = true;
      })
      .catch(() => {
        if (generation !== prefetchGenerationRef.current) {
          return;
        }
        prefetchCompleteRef.current = true;
      });

    prefetchPromiseRef.current = promise;
  }, []);

  const selectAllFiltered = useCallback(
    (activeFilters: LeadDatabaseFilters, filteredTotal: number) => {
      if (filteredTotal <= 0) {
        return;
      }

      prefetchGenerationRef.current += 1;
      const generation = prefetchGenerationRef.current;
      exportCancelRef.current = false;

      setExplicitSelection(new Map());
      setAllFilteredActive(true);
      setAllFilteredCount(filteredTotal);
      startPrefetch(activeFilters, generation);
    },
    [startPrefetch]
  );

  const clearSelection = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  const isSelected = useCallback(
    (id: string) => allFilteredActive || explicitSelection.has(id),
    [allFilteredActive, explicitSelection]
  );

  const toggleLead = useCallback(
    (lead: Lead) => {
      if (allFilteredActive) {
        const next = new Map(prefetchLeadsRef.current);
        next.delete(lead.id);
        prefetchGenerationRef.current += 1;
        prefetchPromiseRef.current = null;
        prefetchCompleteRef.current = next.size > 0;
        prefetchLeadsRef.current = next;
        setAllFilteredActive(false);
        setAllFilteredCount(0);
        setExplicitSelection(next);
        return;
      }

      setExplicitSelection((current) => {
        const next = new Map(current);
        if (next.has(lead.id)) {
          next.delete(lead.id);
        } else {
          next.set(lead.id, lead);
        }
        return next;
      });
    },
    [allFilteredActive]
  );

  const togglePage = useCallback(
    (leads: Lead[], checked: boolean) => {
      if (allFilteredActive && !checked) {
        clearSelection();
        return;
      }

      if (allFilteredActive && checked) {
        return;
      }

      setExplicitSelection((current) => {
        const next = new Map(current);
        for (const lead of leads) {
          if (checked) {
            next.set(lead.id, lead);
          } else {
            next.delete(lead.id);
          }
        }
        return next;
      });
    },
    [allFilteredActive, clearSelection]
  );

  const pageSelectionState = useCallback(
    (leads: Lead[]): PageSelectionState => {
      if (leads.length === 0) return 'none';
      if (allFilteredActive) return 'all';
      const selectedOnPage = leads.filter((lead) => explicitSelection.has(lead.id)).length;
      if (selectedOnPage === 0) return 'none';
      if (selectedOnPage === leads.length) return 'all';
      return 'some';
    },
    [allFilteredActive, explicitSelection]
  );

  const selectedCount = allFilteredActive ? allFilteredCount : explicitSelection.size;

  const getExportLeads = useCallback((): Lead[] => {
    if (allFilteredActive) {
      return Array.from(prefetchLeadsRef.current.values());
    }
    return Array.from(explicitSelection.values());
  }, [allFilteredActive, explicitSelection]);

  const needsPrefetchForExport = useCallback((): boolean => {
    return allFilteredActive && !prefetchCompleteRef.current;
  }, [allFilteredActive]);

  const waitForPrefetch = useCallback(async (): Promise<Lead[] | null> => {
    exportCancelRef.current = false;

    if (!allFilteredActive) {
      return Array.from(explicitSelection.values());
    }

    if (prefetchCompleteRef.current) {
      return Array.from(prefetchLeadsRef.current.values());
    }

    const generation = prefetchGenerationRef.current;
    const promise = prefetchPromiseRef.current;
    if (!promise) {
      return null;
    }

    await promise;

    if (exportCancelRef.current || generation !== prefetchGenerationRef.current || !allFilteredActive) {
      return null;
    }

    return Array.from(prefetchLeadsRef.current.values());
  }, [allFilteredActive, explicitSelection]);

  const cancelPendingExport = useCallback(() => {
    exportCancelRef.current = true;
  }, []);

  const value = useMemo(
    (): LeadDatabaseSelectionContextValue => ({
      selectedCount,
      isSelected,
      toggleLead,
      togglePage,
      pageSelectionState,
      selectAllFiltered,
      clearSelection,
      getExportLeads,
      needsPrefetchForExport,
      waitForPrefetch,
      cancelPendingExport,
    }),
    [
      clearSelection,
      getExportLeads,
      isSelected,
      needsPrefetchForExport,
      pageSelectionState,
      selectAllFiltered,
      selectedCount,
      toggleLead,
      togglePage,
      waitForPrefetch,
      cancelPendingExport,
    ]
  );

  return <LeadDatabaseSelectionContext.Provider value={value}>{children}</LeadDatabaseSelectionContext.Provider>;
}

export function useLeadDatabaseSelection(): LeadDatabaseSelectionContextValue {
  const context = useContext(LeadDatabaseSelectionContext);
  if (!context) {
    throw new Error('useLeadDatabaseSelection must be used within LeadDatabaseSelectionProvider');
  }
  return context;
}
