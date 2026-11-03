'use client';

import { useEffect, useState } from 'react';

/** Matches Tailwind `lg` (≥1024px). SSR-safe: false until mounted. */
export function useIsLgUp() {
  return useMediaQuery('(min-width: 1024px)');
}

/** Matches Tailwind `xl` (≥1280px). SSR-safe: false until mounted. */
export function useIsXlUp() {
  return useMediaQuery('(min-width: 1280px)');
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
