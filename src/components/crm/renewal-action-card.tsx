import { Card } from '@/components/ui/card';
import type { RenewalAction } from '@/types/crm';

type RenewalActionCardProps = {
  action: RenewalAction;
};

export function RenewalActionCard({ action }: RenewalActionCardProps) {
  return (
    <Card padding="sm" className="flex flex-col gap-2 p-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-extrabold text-white"
        style={{ background: action.accent }}
      >
        {action.count}
      </div>
      <div className="text-[13px] font-bold text-slate-800">{action.title}</div>
      <div className="text-[11.5px] text-slate-500">{action.subtitle}</div>
    </Card>
  );
}
