'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

type UseDebouncedSearchInputOptions = {
  /** Query currently reflected in the URL / server filters. */
  committedQuery: string;
  /** Delay before committing typed text. Default 400ms. */
  debounceMs?: number;
  /** Called with the trimmed query when the draft should update the URL. */
  onCommit: (trimmedQuery: string) => void;
};

function isElementFocused(el: HTMLElement | null): boolean {
  return Boolean(el && typeof document !== 'undefined' && document.activeElement === el);
}

/**
 * Keeps search input responsive while debouncing URL/filter updates.
 *
 * Critical behavior: never overwrite the draft from `committedQuery` while the
 * input is focused and a navigation we triggered is catching up — that was
 * wiping characters mid-keystroke on Lead Database / Renewals.
 */
export function useDebouncedSearchInput({
  committedQuery,
  debounceMs = 400,
  onCommit,
}: UseDebouncedSearchInputOptions) {
  const [value, setValue] = useState(committedQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const pendingCommitRef = useRef<string | null>(null);

  valueRef.current = value;
  onCommitRef.current = onCommit;

  const commit = useCallback((raw: string) => {
    const trimmed = raw.trim();
    pendingCommitRef.current = trimmed;
    onCommitRef.current(trimmed);
  }, []);

  useEffect(() => {
    const committed = committedQuery.trim();
    const pending = pendingCommitRef.current;

    if (pending !== null && pending.trim() === committed) {
      pendingCommitRef.current = null;
      if (isElementFocused(inputRef.current)) {
        return;
      }
    }

    if (isElementFocused(inputRef.current)) {
      // Honor external clears (active-filter dismiss) while focused.
      if (committed === '' && pendingCommitRef.current === null && valueRef.current.trim() !== '') {
        setValue('');
      }
      return;
    }

    setValue(committedQuery);
  }, [committedQuery]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === committedQuery.trim()) {
      return;
    }
    const handle = window.setTimeout(() => {
      commit(value);
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [value, committedQuery, debounceMs, commit]);

  const flush = useCallback(() => {
    const trimmed = valueRef.current.trim();
    if (trimmed === committedQuery.trim()) {
      return;
    }
    commit(valueRef.current);
  }, [commit, committedQuery]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        flush();
      }
    },
    [flush]
  );

  return {
    value,
    setValue,
    inputRef,
    flush,
    onBlur: flush,
    onKeyDown,
  };
}
