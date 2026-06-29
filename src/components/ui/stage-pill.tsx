import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { LifecycleStage } from '@/types/crm';
import { cn } from '@/lib/cn';

type StagePillProps = {
  stage: LifecycleStage;
  className?: string;
};

export function StagePill({ stage, className }: StagePillProps) {
  const config = LIFECYCLE_STAGES[stage];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
        className
      )}
      style={{ background: config.tint, color: config.color }}
    >
      <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}
