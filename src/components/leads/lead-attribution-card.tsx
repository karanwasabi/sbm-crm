'use client';

import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { LeadAttribution } from '@/types/crm';

type LeadAttributionCardProps = {
  attribution: LeadAttribution;
};

function label(value: string | null) {
  return value && value.trim() ? value : '—';
}

export function LeadAttributionCard({ attribution }: LeadAttributionCardProps) {
  return (
    <Card>
      <SectionHead title="Lead attribution" subtitle="Inbound marketing source" />
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Source</dt>
          <dd className="font-semibold text-slate-800">{label(attribution.source)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Integration</dt>
          <dd className="font-semibold text-slate-800">{label(attribution.integration)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Campaign</dt>
          <dd className="font-semibold text-slate-800">{label(attribution.campaign)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Form</dt>
          <dd className="font-semibold text-slate-800">{label(attribution.formId)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Platform</dt>
          <dd className="font-semibold text-slate-800">{label(attribution.platform)}</dd>
        </div>
      </dl>
    </Card>
  );
}
