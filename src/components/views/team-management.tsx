'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createStaffAction } from '@/app/(crm)/settings/team-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { formatStaffName, StaffAccessModal } from '@/components/views/staff-access-modal';
import type { StaffAccessRole } from '@/lib/access';
import type { StaffList, StaffMember } from '@/utils/api';

type TeamManagementProps = {
  staff: StaffList;
  currentUserId: string;
};

export function TeamManagement({ staff, currentUserId }: TeamManagementProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [admin, setAdmin] = useState(true);
  const [coach, setCoach] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editingInactive, setEditingInactive] = useState(false);

  const selectedRoles = (): StaffAccessRole[] => {
    const roles: StaffAccessRole[] = [];
    if (admin) roles.push('admin');
    if (coach) roles.push('coach');
    return roles;
  };

  const handleCreate = () => {
    setError(null);
    setSuccess(null);

    const roles = selectedRoles();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (roles.length === 0) {
      setError('Select at least one role.');
      return;
    }

    startTransition(async () => {
      try {
        await createStaffAction({
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          email: email.trim(),
          roles,
        });
        setFirstName('');
        setLastName('');
        setEmail('');
        setAdmin(true);
        setCoach(true);
        setSuccess(`Invite sent to ${email.trim()}`);
        router.refresh();
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to add staff member.');
      }
    });
  };

  const openEdit = (member: StaffMember, inactive: boolean) => {
    setEditingMember(member);
    setEditingInactive(inactive);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <SectionHead title="Add staff member" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_auto]">
            <Field label="First name">
              <TextInput value={firstName} onChange={setFirstName} placeholder="Priya" disabled={pending} />
            </Field>
            <Field label="Last name">
              <TextInput value={lastName} onChange={setLastName} placeholder="Optional" disabled={pending} />
            </Field>
            <Field label="Email">
              <TextInput
                value={email}
                onChange={setEmail}
                placeholder="person@example.com"
                type="email"
                disabled={pending}
              />
            </Field>
            <Field label="Roles">
              <div className="flex min-h-[42px] flex-wrap items-center gap-x-4 gap-y-2 pt-0.5">
                <Checkbox checked={admin} onChange={setAdmin} disabled={pending} label="Admin" />
                <Checkbox checked={coach} onChange={setCoach} disabled={pending} label="Coach" />
              </div>
            </Field>
            <div className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
              <span className="hidden pl-1 text-[12.5px] font-semibold xl:invisible xl:block" aria-hidden="true">
                Action
              </span>
              <Button className="w-full xl:w-auto xl:whitespace-nowrap" onClick={handleCreate} disabled={pending}>
                Send invite
              </Button>
            </div>
          </div>
          {success ? <p className="mt-3 text-sm font-semibold text-success-press">{success}</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-danger-press">{error}</p> : null}
        </Card>

        <Card>
          <SectionHead title="Active staff" subtitle="Users with admin or coach access" />
          {staff.active.length === 0 ? (
            <p className="text-sm text-slate-500">No active staff yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {staff.active.map((member) => (
                <StaffRow
                  key={member.user_id}
                  member={member}
                  currentUserId={currentUserId}
                  onEdit={() => openEdit(member, false)}
                  disabled={pending}
                />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHead title="Inactive staff" subtitle="Invited staff without admin or coach access" />
          {staff.inactive.length === 0 ? (
            <p className="text-sm text-slate-500">No inactive staff.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {staff.inactive.map((member) => (
                <StaffRow
                  key={member.user_id}
                  member={member}
                  currentUserId={currentUserId}
                  inactive
                  onEdit={() => openEdit(member, true)}
                  disabled={pending}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <StaffAccessModal
        member={editingMember}
        currentUserId={currentUserId}
        inactive={editingInactive}
        onClose={() => setEditingMember(null)}
        onSaved={() => router.refresh()}
      />
    </>
  );
}

function StaffRow({
  member,
  currentUserId,
  inactive = false,
  onEdit,
  disabled,
}: {
  member: StaffMember;
  currentUserId: string;
  inactive?: boolean;
  onEdit: () => void;
  disabled: boolean;
}) {
  const isSelf = member.user_id === currentUserId;
  const name = formatStaffName(member);

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        inactive ? 'border-slate-100 bg-slate-50/80' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[13px] font-semibold text-slate-800">
            {name}
            {isSelf ? <span className="ml-1.5 text-[11px] font-medium text-slate-400">(you)</span> : null}
          </div>
          {inactive ? <Pill tone="neutral">Inactive</Pill> : null}
          {member.roles.includes('admin') ? <Pill tone="deep">Admin</Pill> : null}
          {member.roles.includes('coach') ? <Pill tone="success">Coach</Pill> : null}
        </div>
        <div className="truncate text-[11px] text-slate-500">{member.email}</div>
      </div>
      <Button variant="light" size="sm" disabled={disabled} onClick={onEdit}>
        {inactive ? 'Edit' : 'Edit access'}
      </Button>
    </div>
  );
}
