import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { RenewalAction } from '@/types/crm';
import { cn } from '@/lib/cn';

type RenewalActionCardProps = {
  action: RenewalAction;
};

export function RenewalActionCard({ action }: RenewalActionCardProps) {
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
      {action.cta && action.href ? (
        <Link
          href={action.href}
          className={cn(
            'inline-flex items-center justify-center self-start rounded-2xl border-b-4 border-b-brand-press bg-brand px-4 py-2.25 text-xs font-semibold text-white no-underline shadow-brand'
          )}
        >
          {action.cta}
        </Link>
      ) : null}
    </Card>
  );
}
