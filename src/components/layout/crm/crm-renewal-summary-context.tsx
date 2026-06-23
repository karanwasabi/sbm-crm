'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CrmRenewalSummaryContextValue = {
  renewalSubtitle: string | null;
  setRenewalSubtitle: (subtitle: string | null) => void;
};

const CrmRenewalSummaryContext = createContext<CrmRenewalSummaryContextValue>({
  renewalSubtitle: null,
  setRenewalSubtitle: () => {},
});

export function CrmRenewalSummaryProvider({ children }: { children: ReactNode }) {
  const [renewalSubtitle, setRenewalSubtitle] = useState<string | null>(null);
  const value = useMemo(() => ({ renewalSubtitle, setRenewalSubtitle }), [renewalSubtitle]);

  return <CrmRenewalSummaryContext.Provider value={value}>{children}</CrmRenewalSummaryContext.Provider>;
}

export function useCrmRenewalSummary() {
  return useContext(CrmRenewalSummaryContext);
}
