import { cn } from '@/lib/cn';

type StatusDotProps = {
  status?: 'ok' | 'warn' | 'err' | 'neutral';
  className?: string;
};

const statusColors = {
  ok: 'bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.18)]',
  warn: 'bg-motivation shadow-[0_0_0_3px_rgba(255,183,3,0.18)]',
  err: 'bg-danger shadow-[0_0_0_3px_rgba(244,63,94,0.18)]',
  neutral: 'bg-slate-400 shadow-[0_0_0_3px_rgba(148,163,184,0.18)]',
};

export function StatusDot({ status = 'ok', className }: StatusDotProps) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', statusColors[status], className)} />;
}
