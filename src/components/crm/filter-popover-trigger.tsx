import { cn } from '@/lib/cn';

export function filterPopoverTriggerClass(active?: boolean) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-x-0 border-t-0 border-b-[3px] font-semibold transition-all duration-100 outline-none',
    'rounded-2xl px-4 py-2.25 text-xs',
    active
      ? 'border-b-brand-press bg-brand text-white shadow-brand'
      : 'border-b-slate-200 bg-white text-brand shadow-sm hover:bg-slate-50'
  );
}
