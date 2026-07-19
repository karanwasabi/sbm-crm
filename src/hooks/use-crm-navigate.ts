'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

/** Soft-navigate with a React transition so route `loading.tsx` can paint immediately. */
export function useCrmNavigate() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isHistoryPending, setHistoryPending] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      setHistoryPending(true);
      setPendingHref(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const push = useCallback(
    (href: string) => {
      setPendingHref(href);
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return {
    push,
    pendingHref,
    isPending: isPending || isHistoryPending,
  };
}
