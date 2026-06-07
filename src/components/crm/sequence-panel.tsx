import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import type { CampaignSequence } from '@/types/crm';

type SequencePanelProps = {
  sequences: CampaignSequence[];
};

export function SequencePanel({ sequences }: SequencePanelProps) {
  return (
    <Card>
      <SectionHead title="Campaign sequences" subtitle="Active drip & nurture flows" />
      <div className="flex flex-col gap-2">
        {sequences.map((seq) => (
          <div
            key={seq.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 px-3.5 py-3"
          >
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{seq.name}</div>
              <div className="text-[11px] text-slate-500">
                {seq.steps} steps · {seq.enrolled} enrolled
              </div>
            </div>
            <Pill tone="success">{seq.status}</Pill>
          </div>
        ))}
      </div>
    </Card>
  );
}
