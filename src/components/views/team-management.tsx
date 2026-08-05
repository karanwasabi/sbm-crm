'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState, useTransition } from 'react';
import { createStaffAction } from '@/app/(crm)/settings/team-actions';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { formatStaffName } from '@/components/views/staff-access-modal';
import type { StaffAccessRole } from '@/lib/access';
import { toTitleCase } from '@/lib/title-case';
import { cn } from '@/lib/cn';
import type { StaffList, StaffMember } from '@/utils/api';

const StaffAccessModal = dynamic(
  () => import('@/components/views/staff-access-modal').then((module) => ({ default: module.StaffAccessModal })),
  { ssr: false }
);

type TeamManagementProps = {
  staff: StaffList;
  currentUserId: string;
};

export function TeamManagement({ staff, currentUserId }: TeamManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [admin, setAdmin] = useState(true);
  const [coach, setCoach] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editingInactive, setEditingInactive] = useState(false);

  const selectedRoles = (): StaffAccessRole[] => {
    const roles: StaffAccessRole[] = [];
    if (admin) roles.push('admin');
    if (coach) roles.push('coach');
    if (marketing) roles.push('marketing');
    return roles;
  };

  const setAdminRole = (enabled: boolean) => {
    setAdmin(enabled);
    if (enabled) setMarketing(false);
  };

  const setCoachRole = (enabled: boolean) => {
    setCoach(enabled);
    if (enabled) setMarketing(false);
  };

  const setMarketingRole = (enabled: boolean) => {
    setMarketing(enabled);
    if (enabled) {
      setAdmin(false);
      setCoach(false);
    }
  };

  const handleCreate = () => {
    const roles = selectedRoles();
    if (!firstName.trim()) {
      toast({ message: 'First name is required.', variant: 'error' });
      return;
    }
    if (!email.trim()) {
      toast({ message: 'Email is required.', variant: 'error' });
      return;
    }
    if (roles.length === 0) {
      toast({ message: 'Select at least one role.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      const normalizedFirstName = toTitleCase(firstName.trim());
      const normalizedLastName = lastName.trim() ? toTitleCase(lastName.trim()) : undefined;
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const result = await createStaffAction({
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          email: normalizedEmail,
          roles,
        });
        if (!result.ok) {
          toast({ message: result.error, variant: 'error' });
          return;
        }
        setFirstName('');
        setLastName('');
        setEmail('');
        setAdmin(true);
        setCoach(true);
        setMarketing(false);
        toast({
          message: result.member.promoted
            ? `${normalizedEmail} promoted to staff`
            : `Invite sent to ${normalizedEmail}`,
          variant: 'success',
        });
        router.refresh();
      } catch (createError) {
        toast({
          message: createError instanceof Error ? createError.message : 'Failed to add staff member.',
          variant: 'error',
        });
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
          <SectionHead
            title="Add staff member"
            subtitle="Staff get member portal access. Assign Admin, Coach, or Marketing for CRM access."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_auto]">
            <Field label="First name">
              <TextInput
                value={firstName}
                onChange={(value) => setFirstName(toTitleCase(value))}
                placeholder="Priya"
                disabled={pending}
              />
            </Field>
            <Field label="Last name">
              <TextInput
                value={lastName}
                onChange={(value) => setLastName(toTitleCase(value))}
                placeholder="Optional"
                disabled={pending}
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={email}
                onChange={(value) => setEmail(value.toLowerCase())}
                placeholder="person@example.com"
                type="email"
                disabled={pending}
              />
            </Field>
            <Field label="Roles">
              <div className="flex min-h-[42px] flex-wrap items-center gap-x-4 gap-y-2 pt-0.5">
                <Checkbox checked={admin} onChange={setAdminRole} disabled={pending} label="Admin" />
                <Checkbox checked={coach} onChange={setCoachRole} disabled={pending} label="Coach" />
                <Checkbox checked={marketing} onChange={setMarketingRole} disabled={pending} label="Marketing" />
              </div>
            </Field>
            <div className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
              <span className="hidden pl-1 text-[12.5px] font-semibold xl:invisible xl:block" aria-hidden="true">
                Action
              </span>
              <Button
                className="w-full xl:w-auto xl:whitespace-nowrap"
                onClick={handleCreate}
                loading={pending}
                loadingLabel="Sending…"
              >
                Send invite
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHead title="Active staff" subtitle="Users with admin, coach, or marketing access" />
          {staff.active.length === 0 ? (
            <p className="text-sm text-slate-500">No active staff yet.</p>
          ) : (
            <StaffTable>
              {staff.active.map((member) => (
                <StaffRow
                  key={member.user_id}
                  member={member}
                  currentUserId={currentUserId}
                  onEdit={() => openEdit(member, false)}
                  disabled={pending}
                />
              ))}
            </StaffTable>
          )}
        </Card>

        <Card>
          <SectionHead title="Inactive staff" subtitle="Invited staff without CRM access roles" />
          {staff.inactive.length === 0 ? (
            <p className="text-sm text-slate-500">No inactive staff.</p>
          ) : (
            <StaffTable>
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
            </StaffTable>
          )}
        </Card>
      </div>

      {editingMember ? (
        <StaffAccessModal
          member={editingMember}
          currentUserId={currentUserId}
          inactive={editingInactive}
          onClose={() => setEditingMember(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

function StaffTable({ children }: { children: ReactNode }) {
  return (
    <DataTable className="-mx-1">
      <DataTableHead>
        <DataTableHeaderCell className="w-[28%] min-w-[160px]">Name</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[32%] min-w-[200px]">Email</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[24%] min-w-[180px]">Access</DataTableHeaderCell>
        <DataTableHeaderCell className="w-[16%] min-w-[120px] text-right"> </DataTableHeaderCell>
      </DataTableHead>
      <DataTableBody>{children}</DataTableBody>
    </DataTable>
  );
}

function RolePill({ label, active, tone }: { label: string; active: boolean; tone: 'deep' | 'success' | 'brand' }) {
  return (
    <Pill
      tone={active ? tone : 'neutral'}
      className={cn(!active && 'border border-dashed border-slate-200 bg-slate-50 text-slate-400')}
    >
      {label}
    </Pill>
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
  const hasAdmin = member.roles.includes('admin');
  const hasCoach = member.roles.includes('coach');
  const hasMarketing = member.roles.includes('marketing');
  const hasSuperadmin = member.roles.includes('superadmin');

  return (
    <DataTableRow className={cn(inactive && 'bg-slate-50/60')}>
      <DataTableCell>
        <div className="text-[13px] font-semibold text-slate-800">
          {name}
          {isSelf ? <span className="ml-1.5 text-[11px] font-medium text-slate-400">(you)</span> : null}
        </div>
      </DataTableCell>
      <DataTableCell>
        <div className="truncate text-[12px] text-slate-500">{member.email}</div>
      </DataTableCell>
      <DataTableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <RolePill label="Admin" active={hasAdmin} tone="deep" />
          <RolePill label="Coach" active={hasCoach} tone="success" />
          <RolePill label="Marketing" active={hasMarketing} tone="brand" />
          {hasSuperadmin ? <RolePill label="Superadmin" active tone="deep" /> : null}
        </div>
      </DataTableCell>
      <DataTableCell className="text-right">
        <Button variant="light" size="sm" disabled={disabled || isSelf} onClick={onEdit}>
          {inactive ? 'Edit' : 'Edit access'}
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}
