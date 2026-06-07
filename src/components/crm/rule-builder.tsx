import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { StatusDot } from '@/components/ui/status-dot';
import type { CommunicationRule } from '@/types/crm';

type RuleBuilderProps = {
  rules: CommunicationRule[];
};

export function RuleBuilder({ rules }: RuleBuilderProps) {
  return (
    <Card>
      <SectionHead
        title="Automation rules"
        subtitle="Trigger → Condition → Action"
        right={
          <Button variant="primary" size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />}>
            New rule
          </Button>
        }
      />
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-2xl border border-slate-100 bg-canvas-cool p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-800">{rule.name}</span>
              <StatusDot status={rule.active ? 'ok' : 'neutral'} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-slate-600">
              <span className="rounded-full bg-white px-2.5 py-1 text-brand">{rule.trigger}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="rounded-full bg-white px-2.5 py-1">{rule.condition}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="rounded-full bg-white px-2.5 py-1 text-success-press">{rule.action}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
