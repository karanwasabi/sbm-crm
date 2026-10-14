'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createEventSlotAction, updateEventAction, updateEventSlotAction } from '@/app/(crm)/events/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SectionHead } from '@/components/ui/section-head';
import { StagePill } from '@/components/ui/stage-pill';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { formatDateTimeIST, istLocalInputToRFC3339 } from '@/lib/ist-datetime';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { LifecycleStage } from '@/types/crm';
import {
  EVENT_STATUS_OPTIONS,
  eventStatusLabel,
  eventStatusTone,
  type CrmEvent,
  type EventRegistration,
  type EventStatus,
} from '@/types/events';

type EventDetailViewProps = {
  event: CrmEvent;
  registrations: EventRegistration[];
};

/** Converts a `datetime-local` value (entered as IST) to RFC3339. */
function slotInputToRFC3339(value: string): string {
  const [date, time] = value.split('T');
  if (!date || !time) return '';
  return istLocalInputToRFC3339(date, time);
}

export function EventDetailView({ event, registrations }: EventDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(event.name);
  const [slug, setSlug] = useState(event.slug);
  const [description, setDescription] = useState(event.description);
  const [status, setStatus] = useState<EventStatus>(event.status);

  const [slotLabel, setSlotLabel] = useState('');
  const [slotStartsAt, setSlotStartsAt] = useState('');

  const dirty =
    name.trim() !== event.name ||
    slug.trim() !== event.slug ||
    description.trim() !== event.description ||
    status !== event.status;

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ message: 'Name is required.', variant: 'error' });
      return;
    }
    startTransition(async () => {
      try {
        const updated = await updateEventAction(event.id, {
          name: trimmedName,
          slug: slug.trim(),
          description: description.trim(),
          status,
        });
        setName(updated.name);
        setSlug(updated.slug);
        setDescription(updated.description);
        setStatus(updated.status);
        toast({ message: 'Event updated', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update event.',
          variant: 'error',
        });
      }
    });
  };

  const handleAddSlot = () => {
    const label = slotLabel.trim();
    if (!label) {
      toast({ message: 'Slot label is required.', variant: 'error' });
      return;
    }
    const startsAt = slotInputToRFC3339(slotStartsAt);
    if (!startsAt) {
      toast({ message: 'Slot start date and time are required.', variant: 'error' });
      return;
    }
    startTransition(async () => {
      try {
        await createEventSlotAction(event.id, {
          label,
          startsAt,
          sortOrder: event.slots.length,
        });
        setSlotLabel('');
        setSlotStartsAt('');
        toast({ message: 'Slot added', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to add slot.',
          variant: 'error',
        });
      }
    });
  };

  const handleToggleSlot = (slotId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await updateEventSlotAction(event.id, slotId, { isActive });
        toast({ message: isActive ? 'Slot activated' : 'Slot deactivated', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update slot.',
          variant: 'error',
        });
      }
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(event.publicUrl);
      toast({ message: 'Public URL copied', variant: 'success' });
    } catch {
      toast({ message: 'Could not copy URL.', variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/events" className="text-xs font-semibold text-brand no-underline">
          ← All events
        </Link>
      </div>

      <Card>
        <SectionHead
          title={event.name}
          subtitle={`${event.registrationCount.toLocaleString('en-IN')} registrations`}
          right={<Pill tone={eventStatusTone(event.status)}>{eventStatusLabel(event.status)}</Pill>}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Name">
            <TextInput value={name} onChange={setName} disabled={pending} />
          </Field>
          <Field label="Slug">
            <TextInput value={slug} onChange={setSlug} disabled={pending} />
          </Field>
          <Field label="Status">
            <SearchableSelect
              value={status}
              onChange={(value) => setStatus(value as EventStatus)}
              options={EVENT_STATUS_OPTIONS}
              searchable={false}
              disabled={pending}
              className="w-full text-sm"
            />
          </Field>
          <Field label="Public URL">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-700">
                {event.publicUrl || '—'}
              </code>
              <Button size="sm" variant="light" onClick={() => void handleCopy()} disabled={!event.publicUrl}>
                Copy
              </Button>
            </div>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={pending}
            />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleSave} disabled={!dirty} loading={pending} loadingLabel="Saving…">
            Save changes
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHead title="Slots" subtitle="Times are entered and shown in IST." />
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_240px_auto]">
          <Field label="Label">
            <TextInput value={slotLabel} onChange={setSlotLabel} placeholder="Saturday morning" disabled={pending} />
          </Field>
          <Field label="Starts at (IST)">
            <TextInput type="datetime-local" value={slotStartsAt} onChange={setSlotStartsAt} disabled={pending} />
          </Field>
          <Button onClick={handleAddSlot} loading={pending} loadingLabel="Adding…">
            Add slot
          </Button>
        </div>

        {event.slots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No slots yet.</p>
        ) : (
          <DataTable className="-mx-1 mt-4">
            <DataTableHead>
              <DataTableHeaderCell className="min-w-[160px]">Label</DataTableHeaderCell>
              <DataTableHeaderCell className="min-w-[180px]">Starts</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[110px]">Registrations</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[100px]">Status</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[120px] text-right"> </DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {event.slots.map((slot) => (
                <DataTableRow key={slot.id} className={cn(!slot.isActive && 'bg-slate-50/60')}>
                  <DataTableCell>
                    <span className="text-[13px] font-semibold text-slate-800">{slot.label}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-600">{formatDateTimeIST(slot.startsAt)}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-600">{slot.registrationCount.toLocaleString('en-IN')}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={slot.isActive ? 'success' : 'neutral'}>{slot.isActive ? 'Active' : 'Inactive'}</Pill>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => handleToggleSlot(slot.id, !slot.isActive)}
                    >
                      {slot.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card>
        <SectionHead
          title="Registrations"
          subtitle={
            registrations.length >= 500
              ? 'Showing the latest 500 registrations'
              : `${registrations.length.toLocaleString('en-IN')} registered`
          }
        />
        {registrations.length === 0 ? (
          <p className="text-sm text-slate-500">No registrations yet.</p>
        ) : (
          <DataTable className="-mx-1">
            <DataTableHead>
              <DataTableHeaderCell className="min-w-[160px]">Lead</DataTableHeaderCell>
              <DataTableHeaderCell className="min-w-[200px]">Email</DataTableHeaderCell>
              <DataTableHeaderCell className="min-w-[140px]">Slot</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[120px]">Stage</DataTableHeaderCell>
              <DataTableHeaderCell className="min-w-[160px]">Registered</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {registrations.map((registration) => (
                <DataTableRow key={registration.id}>
                  <DataTableCell>
                    <Link
                      href={`/customers/${registration.leadId}`}
                      className="text-[13px] font-semibold text-slate-800 no-underline hover:text-brand"
                    >
                      {registration.leadName || registration.leadEmail}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-600">{registration.leadEmail}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-600">{registration.slotLabel}</span>
                  </DataTableCell>
                  <DataTableCell>
                    {registration.lifecycleStage in LIFECYCLE_STAGES ? (
                      <StagePill stage={registration.lifecycleStage as LifecycleStage} />
                    ) : (
                      <span className="text-[12px] text-slate-500">{registration.lifecycleStage}</span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-500">{formatDateTimeIST(registration.createdAt)}</span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
