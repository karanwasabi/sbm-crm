'use client';

import dynamic from 'next/dynamic';

export const GrapesMjmlEditor = dynamic(
  () => import('@/components/comms/grapes-mjml-editor').then((mod) => mod.GrapesMjmlEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500">
        Loading email designer…
      </div>
    ),
  }
);
