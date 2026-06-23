'use client';

import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { RenewalAction } from '@/types/crm';
import { cn } from '@/lib/cn';
import type { RenewalBucketFilter } from '@/lib/renewal-display';

type RenewalActionCardProps = {
  action: RenewalAction;
  onNavigate?: (bucket: RenewalBucketFilter) => void;
  navigatePending?: boolean;
};

export function RenewalActionCard({ action, onNavigate, navigatePending = false }: RenewalActionCardProps) {
  const handleNavigate = () => {
    if (!action.bucket || !onNavigate) return;
    onNavigate(action.bucket);
  };

  return (
    <Card padding="sm" className="flex flex-col gap-3 border-l-4 p-4" style={{ borderLeftColor: action.accent }}>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-extrabold text-white"
        style={{ background: action.accent }}
      >
        {action.count}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="text-[13px] font-bold text-slate-800">{action.title}</div>
        <div className="text-[11.5px] text-slate-500">{action.subtitle}</div>
      </div>
      {action.cta && action.bucket && onNavigate ? (
        <button
          type="button"
          onClick={handleNavigate}
          disabled={navigatePending}
          aria-busy={navigatePending || undefined}
          className={cn(
            'inline-flex items-center justify-center gap-2 self-start rounded-2xl border-b-4 border-b-brand-press bg-brand px-4 py-2.25 text-xs font-semibold text-white shadow-brand',
            navigatePending && 'cursor-wait opacity-90'
          )}
        >
          {navigatePending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
          {action.cta}
        </button>
      ) : null}
    </Card>
  );
}
