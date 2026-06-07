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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase',
        className
      )}
      style={{ background: config.tint, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}
