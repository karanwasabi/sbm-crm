'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Profile } from '@/types/profile';

type CrmProfileContextValue = {
  profile: Profile | null;
  profileError: string | null;
  roleLabel: string;
};

const CrmProfileContext = createContext<CrmProfileContextValue>({
  profile: null,
  profileError: null,
  roleLabel: 'Staff',
});

export function CrmProfileProvider({
  profile,
  profileError,
  roleLabel,
  children,
}: CrmProfileContextValue & { children: ReactNode }) {
  return (
    <CrmProfileContext.Provider value={{ profile, profileError, roleLabel }}>{children}</CrmProfileContext.Provider>
  );
}

export function useCrmProfile() {
  return useContext(CrmProfileContext);
}
