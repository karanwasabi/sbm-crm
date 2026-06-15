'use client';

import { Globe } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-4 w-[1.33rem]',
  md: 'h-5 w-[1.66rem]',
} as const;

type CountryFlagProps = {
  code: string;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function CountryFlag({ code, size = 'sm', className }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const normalized = code.trim().toLowerCase();

  if (!normalized || failed) {
    return <Globe size={size === 'md' ? 18 : 16} className={cn('shrink-0 text-muted-foreground', className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static SVG assets
    <img
      src={`/flags/4x3/${normalized}.svg`}
      alt=""
      aria-hidden
      className={cn('shrink-0 object-cover', sizeClasses[size], className)}
      onError={() => setFailed(true)}
    />
  );
}
