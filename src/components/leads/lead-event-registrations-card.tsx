'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import type { LeadEventRegistration } from '@/types/events';

type LeadEventRegistrationsCardProps = {
  registrations: LeadEventRegistration[];
  canLinkToEvents?: boolean;
};

type EventGroup = {
  eventId: string;
  eventName: string;
  slots: LeadEventRegistration[];
};

export function LeadEventRegistrationsCard({
  registrations,
  canLinkToEvents = false,
}: LeadEventRegistrationsCardProps) {
  const groups = useMemo(() => {
    const byEvent = new Map<string, EventGroup>();
    for (const registration of registrations) {
      const existing = byEvent.get(registration.eventId);
      if (existing) {
        existing.slots.push(registration);
        continue;
      }
      byEvent.set(registration.eventId, {
        eventId: registration.eventId,
        eventName: registration.eventName,
        slots: [registration],
      });
    }
    return Array.from(byEvent.values()).map((group) => ({
      ...group,
      slots: [...group.slots].sort((a, b) => a.slotStartsAt.localeCompare(b.slotStartsAt)),
    }));
  }, [registrations]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <p className="mb-3 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Events</p>
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.eventId} className="space-y-2">
            <div className="min-w-0">
              {canLinkToEvents ? (
                <Link
                  href={`/events/${group.eventId}`}
                  className="text-[13px] font-semibold text-slate-800 no-underline hover:text-brand"
                >
                  {group.eventName}
                </Link>
              ) : (
                <p className="text-[13px] font-semibold text-slate-800">{group.eventName}</p>
              )}
            </div>
            <ul className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
              {group.slots.map((slot) => (
                <li key={slot.id} className="rounded-lg bg-white px-2.5 py-2">
                  <p className="text-[13px] font-semibold text-slate-800">{slot.slotLabel}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Signed up {formatDateTimeIST(slot.createdAt)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}
