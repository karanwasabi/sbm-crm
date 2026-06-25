import { cn } from '@/lib/cn';
import type { EmailTemplateLayout } from '@/lib/email-template-types';

type LayoutThumbnailProps = {
  layout: EmailTemplateLayout;
  selected?: boolean;
};

export function LayoutThumbnail({ layout, selected }: LayoutThumbnailProps) {
  return (
    <div
      className={cn(
        'pointer-events-none flex h-16 w-full items-center justify-center rounded-xl border bg-white p-2',
        selected ? 'border-brand' : 'border-slate-200'
      )}
      aria-hidden
    >
      {layout === 'simple' && (
        <div className="flex w-full flex-col gap-1 px-1">
          <div className="h-1.5 w-2/3 rounded-full bg-slate-300" />
          <div className="h-1 w-full rounded-full bg-slate-200" />
          <div className="h-1 w-5/6 rounded-full bg-slate-200" />
          <div className="mt-0.5 h-2 w-1/3 rounded-full bg-brand/70" />
        </div>
      )}
      {layout === 'hero' && (
        <div className="flex w-full flex-col overflow-hidden rounded-md border border-slate-200">
          <div className="h-6 bg-linear-to-r from-brand to-violet-500" />
          <div className="space-y-1 p-1.5">
            <div className="h-1 w-full rounded-full bg-slate-200" />
            <div className="h-1.5 w-1/3 rounded-full bg-brand/70" />
          </div>
        </div>
      )}
      {layout === 'cta' && (
        <div className="flex w-full flex-col items-center gap-1 px-1">
          <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
          <div className="h-1 w-3/4 rounded-full bg-slate-200" />
          <div className="mt-0.5 h-2.5 w-2/5 rounded-full bg-brand" />
        </div>
      )}
      {layout === 'two_column' && (
        <div className="grid w-full grid-cols-[1.4fr_1fr] gap-1 px-0.5">
          <div className="space-y-1">
            <div className="h-1.5 w-2/3 rounded-full bg-slate-300" />
            <div className="h-1 w-full rounded-full bg-slate-200" />
          </div>
          <div className="space-y-1 rounded-md bg-slate-100 p-1">
            <div className="h-1 w-full rounded-full bg-slate-300" />
            <div className="h-1 w-4/5 rounded-full bg-slate-200" />
          </div>
        </div>
      )}
      {layout === 'receipt' && (
        <div className="w-full rounded-md border border-slate-200 bg-slate-50 p-1.5">
          <div className="mb-1 h-1 w-1/3 rounded-full bg-slate-300" />
          <div className="space-y-0.5">
            <div className="h-1 w-full rounded-full bg-slate-200" />
            <div className="h-1 w-full rounded-full bg-slate-200" />
          </div>
        </div>
      )}
      {layout === 'digest' && (
        <div className="flex w-full flex-col gap-1 px-0.5">
          <div className="rounded border border-slate-200 p-1">
            <div className="h-1 w-2/3 rounded-full bg-slate-300" />
          </div>
          <div className="rounded border border-slate-200 p-1">
            <div className="h-1 w-1/2 rounded-full bg-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
}
