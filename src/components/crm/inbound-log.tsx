import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { InboundLead } from '@/types/crm';

type InboundLogProps = {
  leads: InboundLead[];
};

export function InboundLog({ leads }: InboundLogProps) {
  return (
    <Card>
      <SectionHead title="Recent inbound" subtitle="UTM-attributed leads · last 24 hrs" />
      <div className="flex flex-col gap-2">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-canvas-cool px-3.5 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-800">{lead.name}</div>
              <div className="text-[11px] text-slate-500">
                {lead.source} · {lead.medium} · {lead.campaign}
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-slate-400">{lead.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
