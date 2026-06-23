'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
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
  const value = useMemo(() => ({ profile, profileError, roleLabel }), [profile, profileError, roleLabel]);

  return <CrmProfileContext.Provider value={value}>{children}</CrmProfileContext.Provider>;
}

export function useCrmProfile() {
  return useContext(CrmProfileContext);
}
