'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTransition } from 'react';
import { dismissLeadContactDuplicateAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { ContactDuplicate, LeadDetail } from '@/types/crm';

type DuplicateContactCardProps = {
  lead: LeadDetail;
  duplicates: ContactDuplicate[];
  onUpdated: () => void;
};

export function DuplicateContactCard({ lead, duplicates, onUpdated }: DuplicateContactCardProps) {
  const [pending, startTransition] = useTransition();

  if (duplicates.length === 0) {
    return null;
  }

  const hasPayingDuplicate = duplicates.some((d) => d.isPayingMember);

  const handleDismiss = (linkId: number) => {
    startTransition(async () => {
      const result = await dismissLeadContactDuplicateAction(lead.id, linkId);
      if (!result.error) {
        onUpdated();
      }
    });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <SectionHead
            title={hasPayingDuplicate ? 'Shared contact with a paying member' : 'Duplicate contact detected'}
            subtitle={
              hasPayingDuplicate
                ? 'Do not change profile data without ops review—verify these are different people.'
                : 'Another lead uses the same phone or email.'
            }
          />
          <div className="mt-3 flex flex-col gap-4">
            {duplicates.map((dup) => (
              <div key={dup.linkId} className="rounded-2xl border border-amber-200/80 bg-white p-3.5">
                <p className="mb-2 text-xs font-bold tracking-wide text-amber-800 uppercase">
                  {dup.matchType === 'phone' ? 'Same phone' : 'Same email'} · {dup.matchValue}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pr-3 pb-2 font-medium" />
                        <th className="pr-3 pb-2 font-medium">This lead</th>
                        <th className="pb-2 font-medium">Other lead</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-800">
                      <tr>
                        <td className="py-1 pr-3 text-slate-500">Name</td>
                        <td className="py-1 pr-3 font-semibold">{lead.name}</td>
                        <td className="py-1 font-semibold">{dup.otherLeadName}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-slate-500">Email</td>
                        <td className="py-1 pr-3">{lead.email}</td>
                        <td className="py-1">{dup.otherLeadEmail}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-slate-500">Phone</td>
                        <td className="py-1 pr-3">{lead.phone || '—'}</td>
                        <td className="py-1">{dup.otherLeadPhone || '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-slate-500">Stage</td>
                        <td className="py-1 pr-3">{LIFECYCLE_STAGES[lead.stage].label}</td>
                        <td className="py-1">
                          {LIFECYCLE_STAGES[dup.otherLeadStage].label}
                          {dup.isPayingMember ? ' · Paying member' : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/customers/${dup.otherLeadId}`} target="_blank" rel="noopener noreferrer">
                    <Button type="button" size="sm" variant="light">
                      View other lead
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => handleDismiss(dup.linkId)}
                  >
                    Not the same person
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
