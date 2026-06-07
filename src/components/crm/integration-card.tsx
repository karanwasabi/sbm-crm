import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';
import type { IntegrationStatus } from '@/types/crm';

type IntegrationCardProps = {
  name: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  status: IntegrationStatus;
};

const statusMap: Record<IntegrationStatus, 'ok' | 'warn' | 'err'> = {
  connected: 'ok',
  warning: 'warn',
  error: 'err',
};

export function IntegrationCard({ name, subtitle, icon: Icon, color, status }: IntegrationCardProps) {
  return (
    <Card padding="sm" className="flex items-center gap-3.5 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-slate-800">{name}</div>
        <div className="text-[11.5px] text-slate-500">{subtitle}</div>
      </div>
      <StatusDot status={statusMap[status]} />
    </Card>
  );
}
