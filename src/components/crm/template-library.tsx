import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import type { MessageTemplate } from '@/types/crm';

type TemplateLibraryProps = {
  templates: MessageTemplate[];
};

export function TemplateLibrary({ templates }: TemplateLibraryProps) {
  return (
    <Card>
      <SectionHead title="Template library" subtitle="Email + WhatsApp templates" />
      <div className="flex flex-col gap-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 px-3.5 py-3 hover:bg-canvas-cool"
          >
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{template.name}</div>
              <div className="text-[11px] text-slate-500">Last used {template.lastUsed}</div>
            </div>
            <Pill tone={template.channel === 'Email' ? 'brand' : 'success'}>{template.channel}</Pill>
          </div>
        ))}
      </div>
    </Card>
  );
}
