'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useIsLgUp } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';

/** Renders only one tree: mobile below `lg`, desktop at `lg+`. Desktop-first before hydration. */
export function ResponsiveList({
  mobile,
  desktop,
  className,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
  className?: string;
}) {
  const isLgUp = useIsLgUp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // CRM is desktop-primary: avoid dual trees and avoid a mobile flash on large screens.
  const showDesktop = !ready || isLgUp;

  return <div className={cn(className)}>{showDesktop ? desktop : mobile}</div>;
}
