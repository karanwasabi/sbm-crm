'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import {
  cancelLifestyleAuditBookingAction,
  loadLifestyleAuditBookingsAction,
  saveLifestyleAuditScheduleAction,
  syncLifestyleAuditBookingCalendarAction,
} from '@/app/(crm)/lifestyle-audit/actions';
import { TabBar } from '@/components/crm/tab-bar';
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
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import type {
  LifestyleAuditBooking,
  LifestyleAuditBookingsPage,
  LifestyleAuditCoachOption,
  LifestyleAuditSchedule,
  LifestyleAuditScheduleSlot,
} from '@/types/lifestyle-audit';

type Tab = 'Schedule' | 'Bookings';

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'hold', label: 'Hold' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'payment_failed', label: 'Payment failed' },
];

function coachLabel(c: LifestyleAuditCoachOption): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return name ? `${name} (${c.email})` : c.email || c.userId;
}

function bookingCoachName(b: LifestyleAuditBooking): string {
  const name = [b.coachFirstName, b.coachLastName].filter(Boolean).join(' ').trim();
  return name || b.coachEmail || b.coachUserId;
}

function statusTone(status: string): 'success' | 'warn' | 'danger' | 'neutral' {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'hold':
      return 'warn';
    case 'cancelled':
    case 'payment_failed':
    case 'expired':
      return 'danger';
    default:
      return 'neutral';
  }
}

function calendarSyncTone(status: string | null): 'success' | 'warn' | 'danger' | 'neutral' {
  switch (status) {
    case 'synced':
      return 'success';
    case 'pending':
    case 'skipped':
      return 'warn';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

function canRetryCalendarSync(b: LifestyleAuditBooking): boolean {
  if (b.status !== 'confirmed') return false;
  if (b.googleMeetLink && b.calendarSyncStatus === 'synced') return false;
  const sync = b.calendarSyncStatus;
  return !sync || sync === 'failed' || sync === 'skipped' || sync === 'pending';
}

type Props = {
  initialSchedule: LifestyleAuditSchedule;
  coaches: LifestyleAuditCoachOption[];
  initialBookings: LifestyleAuditBookingsPage;
};

export function LifestyleAuditView({ initialSchedule, coaches, initialBookings }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('Schedule');
  const [pending, startTransition] = useTransition();

  const [weekdays, setWeekdays] = useState<number[]>(initialSchedule.settings.operatingWeekdays);
  const [slots, setSlots] = useState<LifestyleAuditScheduleSlot[]>(initialSchedule.slots);

  const [bookingsPage, setBookingsPage] = useState(initialBookings);
  const [statusFilter, setStatusFilter] = useState('');
  const [coachFilter, setCoachFilter] = useState('');

  const coachOptions = useMemo(() => coaches.map((c) => ({ value: c.userId, label: coachLabel(c) })), [coaches]);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => {
        const order = (n: number) => (n === 0 ? 7 : n);
        return order(a) - order(b);
      });
    });
  };

  const updateSlot = (index: number, patch: Partial<LifestyleAuditScheduleSlot>) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { localTime: '09:00', sortOrder: (prev.length + 1) * 10, isActive: true, coachUserIds: [] },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCoachOnSlot = (slotIndex: number, coachId: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== slotIndex) return slot;
        const has = slot.coachUserIds.includes(coachId);
        return {
          ...slot,
          coachUserIds: has ? slot.coachUserIds.filter((id) => id !== coachId) : [...slot.coachUserIds, coachId],
        };
      })
    );
  };

  const saveSchedule = () => {
    if (slots.length === 0) {
      toast({ message: 'Add at least one time slot.', variant: 'error' });
      return;
    }
    for (const slot of slots) {
      if (!slot.localTime.trim()) {
        toast({ message: 'Every slot needs a time.', variant: 'error' });
        return;
      }
      if (slot.coachUserIds.length === 0) {
        toast({ message: `Slot ${slot.localTime} needs at least one coach.`, variant: 'error' });
        return;
      }
    }
    startTransition(async () => {
      try {
        const saved = await saveLifestyleAuditScheduleAction({
          operatingWeekdays: weekdays,
          slots: slots.map((slot, index) => ({
            localTime: slot.localTime.trim(),
            sortOrder: slot.sortOrder || (index + 1) * 10,
            isActive: slot.isActive,
            coachUserIds: slot.coachUserIds,
          })),
        });
        setWeekdays(saved.settings.operatingWeekdays);
        setSlots(saved.slots);
        toast({ message: 'Schedule saved.', variant: 'success' });
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save schedule.',
          variant: 'error',
        });
      }
    });
  };

  const refreshBookings = (next?: { status?: string; coachUserId?: string }) => {
    const status = next?.status ?? statusFilter;
    const coachUserId = next?.coachUserId ?? coachFilter;
    startTransition(async () => {
      try {
        const page = await loadLifestyleAuditBookingsAction({
          status: status || undefined,
          coachUserId: coachUserId || undefined,
          limit: 50,
          offset: 0,
        });
        setBookingsPage(page);
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to load bookings.',
          variant: 'error',
        });
      }
    });
  };

  const cancelBooking = (id: string) => {
    startTransition(async () => {
      try {
        await cancelLifestyleAuditBookingAction(id);
        toast({ message: 'Booking cancelled.', variant: 'success' });
        refreshBookings();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to cancel booking.',
          variant: 'error',
        });
      }
    });
  };

  const retryCalendarSync = (id: string) => {
    startTransition(async () => {
      try {
        await syncLifestyleAuditBookingCalendarAction(id);
        toast({ message: 'Calendar sync completed.', variant: 'success' });
        refreshBookings();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to sync calendar.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <TabBar tabs={['Schedule', 'Bookings']} active={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === 'Schedule' ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-sm font-semibold text-slate-800">Operating weekdays</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Price ₹{(initialSchedule.settings.pricePaise / 100).toFixed(0)} ·{' '}
              {initialSchedule.settings.durationMinutes} min · {initialSchedule.settings.timezone}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-800">Weekly times</div>
              <Button type="button" variant="light" onClick={addSlot}>
                Add time
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-4">
              {slots.map((slot, index) => (
                <div key={`${slot.localTime}-${index}`} className="rounded-xl border border-slate-100 p-3">
                  <div className="mb-3 flex flex-wrap items-end gap-3">
                    <Field label="Time (IST)">
                      <TextInput
                        value={slot.localTime}
                        onChange={(value) => updateSlot(index, { localTime: value })}
                        placeholder="09:30"
                      />
                    </Field>
                    <Button type="button" variant="ghost" onClick={() => removeSlot(index)}>
                      Remove
                    </Button>
                  </div>
                  <div className="mb-2 text-xs font-medium text-slate-500">Coaches</div>
                  <div className="flex flex-wrap gap-2">
                    {coaches.map((coach) => {
                      const selected = slot.coachUserIds.includes(coach.userId);
                      return (
                        <button
                          key={coach.userId}
                          type="button"
                          onClick={() => toggleCoachOnSlot(index, coach.userId)}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            selected
                              ? 'border-slate-800 bg-slate-800 text-white'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {coach.firstName || coach.email.split('@')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={saveSchedule} loading={pending} loadingLabel="Saving…">
                Save schedule
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Status">
                <SearchableSelect
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    refreshBookings({ status: value });
                  }}
                  options={STATUS_OPTIONS}
                  searchable={false}
                />
              </Field>
              <Field label="Coach">
                <SearchableSelect
                  value={coachFilter}
                  onChange={(value) => {
                    setCoachFilter(value);
                    refreshBookings({ coachUserId: value });
                  }}
                  options={[{ value: '', label: 'All coaches' }, ...coachOptions]}
                />
              </Field>
              <Button type="button" variant="light" onClick={() => refreshBookings()} disabled={pending}>
                Refresh
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>When</DataTableHeaderCell>
                <DataTableHeaderCell>Lead</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Coach</DataTableHeaderCell>
                <DataTableHeaderCell>Meet</DataTableHeaderCell>
                <DataTableHeaderCell>Calendar</DataTableHeaderCell>
                <DataTableHeaderCell>Payment</DataTableHeaderCell>
                <DataTableHeaderCell>Actions</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {bookingsPage.bookings.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={8}>No bookings yet.</DataTableCell>
                  </DataTableRow>
                ) : (
                  bookingsPage.bookings.map((b) => (
                    <DataTableRow key={b.id}>
                      <DataTableCell>
                        <div className="font-medium">{b.slotDate}</div>
                        <div className="text-xs text-slate-500">{b.localTime} IST</div>
                      </DataTableCell>
                      <DataTableCell>
                        {b.leadId ? (
                          <Link
                            href={`/customers/${b.leadId}`}
                            className="font-medium text-slate-800 no-underline hover:text-brand"
                          >
                            {b.fullName}
                          </Link>
                        ) : (
                          <span className="font-medium">{b.fullName}</span>
                        )}
                        <div className="text-xs text-slate-500">{b.email}</div>
                        <div className="text-xs text-slate-500">{b.whatsapp}</div>
                      </DataTableCell>
                      <DataTableCell>
                        <Pill tone={statusTone(b.status)}>{b.status}</Pill>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-sm">{bookingCoachName(b)}</div>
                      </DataTableCell>
                      <DataTableCell>
                        {b.googleMeetLink ? (
                          <a
                            href={b.googleMeetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-brand no-underline hover:underline"
                          >
                            Join
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        {b.calendarSyncStatus ? (
                          <Pill tone={calendarSyncTone(b.calendarSyncStatus)}>{b.calendarSyncStatus}</Pill>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <div className="text-xs text-slate-500">₹{(b.amountPaise / 100).toFixed(0)}</div>
                        <div className="text-xs break-all">{b.razorpayPaymentId || b.razorpayOrderId || '—'}</div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-col items-start gap-1">
                          {canRetryCalendarSync(b) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => retryCalendarSync(b.id)}
                            >
                              Retry sync
                            </Button>
                          ) : null}
                          {(b.status === 'hold' || b.status === 'confirmed') && (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => cancelBooking(b.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Showing {bookingsPage.bookings.length} of {bookingsPage.total}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
