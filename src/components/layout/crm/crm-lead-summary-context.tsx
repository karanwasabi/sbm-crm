'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CrmLeadSummaryContextValue = {
  leadTotal: number | null;
  setLeadTotal: (total: number | null) => void;
};

const CrmLeadSummaryContext = createContext<CrmLeadSummaryContextValue>({
  leadTotal: null,
  setLeadTotal: () => {},
});

export function CrmLeadSummaryProvider({ children }: { children: ReactNode }) {
  const [leadTotal, setLeadTotal] = useState<number | null>(null);
  const value = useMemo(() => ({ leadTotal, setLeadTotal }), [leadTotal]);

  return <CrmLeadSummaryContext.Provider value={value}>{children}</CrmLeadSummaryContext.Provider>;
}

export function useCrmLeadSummary() {
  return useContext(CrmLeadSummaryContext);
}
