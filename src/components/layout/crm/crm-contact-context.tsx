'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CrmContactContextValue = {
  contactName: string | null;
  setContactName: (name: string | null) => void;
};

const CrmContactContext = createContext<CrmContactContextValue | null>(null);

export function CrmContactProvider({ children }: { children: ReactNode }) {
  const [contactName, setContactName] = useState<string | null>(null);
  const value = useMemo(() => ({ contactName, setContactName }), [contactName]);
  return <CrmContactContext.Provider value={value}>{children}</CrmContactContext.Provider>;
}

export function useCrmContactName() {
  const context = useContext(CrmContactContext);
  if (!context) {
    throw new Error('useCrmContactName must be used within CrmContactProvider');
  }
  return context;
}
