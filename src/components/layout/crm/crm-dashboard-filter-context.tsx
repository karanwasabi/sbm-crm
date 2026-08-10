'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PerformanceWindowPreset } from '@/lib/performance-display';

export type CrmDashboardFilterRegistration = {
  periodSubtitle: string;
  periodLabel: string;
  periodDates: string | null;
  selected: PerformanceWindowPreset;
  pending: boolean;
  onChange: (days: PerformanceWindowPreset) => void;
};

type CrmDashboardFilterContextValue = {
  registration: CrmDashboardFilterRegistration | null;
  setRegistration: (registration: CrmDashboardFilterRegistration | null) => void;
};

const CrmDashboardFilterContext = createContext<CrmDashboardFilterContextValue>({
  registration: null,
  setRegistration: () => {},
});

export function CrmDashboardFilterProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<CrmDashboardFilterRegistration | null>(null);
  const value = useMemo(() => ({ registration, setRegistration }), [registration]);

  return <CrmDashboardFilterContext.Provider value={value}>{children}</CrmDashboardFilterContext.Provider>;
}

export function useCrmDashboardFilter() {
  return useContext(CrmDashboardFilterContext);
}

export function useRegisterDashboardFilter(registration: CrmDashboardFilterRegistration | null) {
  const { setRegistration } = useCrmDashboardFilter();

  useEffect(() => {
    setRegistration(registration);
  }, [registration, setRegistration]);

  useEffect(
    () => () => {
      setRegistration(null);
    },
    [setRegistration]
  );
}
