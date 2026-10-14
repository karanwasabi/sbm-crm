'use client';

import { Card } from '@/components/ui/card';
import type { IntakeCustomAnswer } from '@/types/crm';

type IntakeAnswersCardProps = {
  customFields: Record<string, IntakeCustomAnswer>;
};

export function IntakeAnswersCard({ customFields }: IntakeAnswersCardProps) {
  const entries = Object.entries(customFields).filter(([, answer]) => {
    const display = answer.display?.trim() || answer.value?.trim();
    return Boolean(display);
  });

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <p className="mb-3 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Intake answers</p>
      <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2 text-sm">
        {entries.map(([id, answer]) => (
          <div key={id} className="contents">
            <dt className="font-semibold text-slate-500">{answer.label?.trim() || id}</dt>
            <dd className="text-slate-800">{answer.display?.trim() || answer.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
