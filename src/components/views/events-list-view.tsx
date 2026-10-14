'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createEventAction } from '@/app/(crm)/events/actions';
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
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { eventStatusLabel, eventStatusTone, type CrmEvent, type EventStatus } from '@/types/events';

type EventsListViewProps = {
  events: CrmEvent[];
};

const CREATE_STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

export function EventsListView({ events }: EventsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EventStatus>('draft');

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ message: 'Name is required.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        const created = await createEventAction({
          name: trimmedName,
          description: description.trim(),
          status,
        });
        setName('');
        setDescription('');
        setStatus('draft');
        toast({ message: `Created ${created.name}`, variant: 'success' });
        router.push(`/events/${created.id}`);
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to create event.',
          variant: 'error',
        });
      }
    });
  };

  const handleCopy = async (event: CrmEvent) => {
    try {
      await navigator.clipboard.writeText(event.publicUrl);
      toast({ message: 'Public URL copied', variant: 'success' });
    } catch {
      toast({ message: 'Could not copy URL.', variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHead
          title="Create event"
          subtitle="Add slots after creating the event. Published events accept public sign-ups."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Name">
            <TextInput value={name} onChange={setName} placeholder="Event name" disabled={pending} />
          </Field>
          <Field label="Status">
            <SearchableSelect
              value={status}
              onChange={(value) => setStatus(value as EventStatus)}
              options={CREATE_STATUS_OPTIONS}
              searchable={false}
              disabled={pending}
              className="w-full text-sm"
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Shown on the public sign-up page"
              rows={3}
              disabled={pending}
            />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleCreate} loading={pending} loadingLabel="Creating…">
            Create event
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHead title="Events" subtitle={`${events.length} total`} />
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet.</p>
        ) : (
          <DataTable className="-mx-1">
            <DataTableHead>
              <DataTableHeaderCell className="min-w-[200px]">Name</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[120px]">Status</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[140px]">Registrations</DataTableHeaderCell>
              <DataTableHeaderCell className="min-w-[220px] text-right"> </DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {events.map((event) => (
                <DataTableRow key={event.id}>
                  <DataTableCell>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-[13px] font-semibold text-slate-800 no-underline hover:text-brand"
                    >
                      {event.name}
                    </Link>
                    <div className="text-[11px] text-slate-400">/{event.slug}</div>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={eventStatusTone(event.status)}>{eventStatusLabel(event.status)}</Pill>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[12px] text-slate-600">
                      {event.registrationCount.toLocaleString('en-IN')}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleCopy(event)}
                        disabled={!event.publicUrl}
                      >
                        Copy URL
                      </Button>
                      <Link href={`/events/${event.id}`} className="no-underline">
                        <Button size="sm" variant="light">
                          Manage
                        </Button>
                      </Link>
                    </div>
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
