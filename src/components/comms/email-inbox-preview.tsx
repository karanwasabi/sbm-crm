'use client';

import { cn } from '@/lib/cn';

type EmailInboxPreviewProps = {
  from: string;
  subject: string;
  html: string;
  to?: string;
  caption?: string;
  className?: string;
};

export function EmailInboxPreview({ from, subject, html, to, caption, className }: EmailInboxPreviewProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      {caption ? (
        <p className="border-b border-slate-100 bg-canvas-cool px-4 py-2 text-xs font-semibold text-slate-500">
          {caption}
        </p>
      ) : null}
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
        <span className="font-semibold text-slate-500">From</span>
        <span className="truncate font-medium text-slate-800">{from || '—'}</span>
        {to ? (
          <>
            <span className="font-semibold text-slate-500">To</span>
            <span className="truncate font-medium text-slate-800">{to}</span>
          </>
        ) : null}
        <span className="font-semibold text-slate-500">Subject</span>
        <span className="font-medium text-slate-800">{subject || '—'}</span>
      </div>
      <iframe title="Email preview" srcDoc={html} sandbox="" className="block h-[360px] w-full border-0 bg-white" />
    </div>
  );
}
