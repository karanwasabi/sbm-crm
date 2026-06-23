'use client';

import { Check } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { revokeStaffAccessAction, updateStaffAccessAction } from '@/app/(crm)/settings/team-actions';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StaffAccessRole } from '@/lib/access';
import { cn } from '@/lib/cn';
import type { StaffMember } from '@/utils/api';

type StaffAccessModalProps = {
  member: StaffMember | null;
  currentUserId: string;
  inactive?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type ModalView = 'edit' | 'revoke-confirm';

const ROLE_OPTIONS: { role: StaffAccessRole; label: string; description: string }[] = [
  { role: 'admin', label: 'Admin', description: 'CRM and forum admin' },
  { role: 'coach', label: 'Coach', description: 'Coach dashboard and forum' },
];

export function StaffAccessModal({ member, currentUserId, inactive = false, onClose, onSaved }: StaffAccessModalProps) {
  const [admin, setAdmin] = useState(false);
  const [coach, setCoach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ModalView>('edit');
  const [pending, startTransition] = useTransition();

  const isSelf = member?.user_id === currentUserId;
  const showRevoke = !inactive && !isSelf;

  useEffect(() => {
    if (!member) return;
    setAdmin(member.roles.includes('admin'));
    setCoach(member.roles.includes('coach'));
    setError(null);
    setView('edit');
  }, [member]);

  const displayName = member ? formatStaffName(member) : '';
  const initials = member ? staffInitials(member) : '';
  const hasSelectedRole = admin || coach;

  const roleEnabled = (role: StaffAccessRole) => {
    if (role === 'admin') return admin;
    return coach;
  };

  const setRoleEnabled = (role: StaffAccessRole, enabled: boolean) => {
    if (role === 'admin') setAdmin(enabled);
    else setCoach(enabled);
  };

  const selectedRoles = (): StaffAccessRole[] => {
    const roles: StaffAccessRole[] = [];
    if (admin) roles.push('admin');
    if (coach) roles.push('coach');
    return roles;
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setView('edit');
      onClose();
    }
  };

  const handleSave = () => {
    if (!member) return;

    const roles = selectedRoles();
    if (roles.length === 0) {
      if (showRevoke) {
        setError(null);
        setView('revoke-confirm');
        return;
      }
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await updateStaffAccessAction(member.user_id, roles);
        onSaved();
        onClose();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save changes.');
      }
    });
  };

  const confirmRevoke = () => {
    if (!member) return;

    setError(null);
    startTransition(async () => {
      try {
        await revokeStaffAccessAction(member.user_id);
        onSaved();
        onClose();
      } catch (revokeError) {
        setError(revokeError instanceof Error ? revokeError.message : 'Failed to revoke access.');
        setView('edit');
      }
    });
  };

  return (
    <Dialog open={member !== null} onOpenChange={handleDialogOpenChange}>
      <DialogContent showCloseButton className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
        {view === 'revoke-confirm' ? (
          <>
            <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
              <DialogTitle className="text-lg font-bold text-slate-900">Revoke access?</DialogTitle>
              <DialogDescription className="sr-only">Confirm revoking staff access roles</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600">
                Revoke all access for <span className="font-semibold text-slate-800">{displayName}</span>? They will
                remain a staff account but lose admin and coach roles.
              </p>
              {error ? <p className="text-sm font-semibold text-danger-press">{error}</p> : null}
            </div>

            <DialogFooter className="-mx-0 -mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
              <Button variant="light" size="sm" onClick={() => setView('edit')} disabled={pending}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmRevoke} loading={pending} loadingLabel="Revoking…">
                Revoke access
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {inactive ? 'Grant access' : 'Edit access'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {inactive
                    ? 'Choose which roles this staff member should receive.'
                    : 'Update admin and coach permissions for this staff member.'}
                </DialogDescription>
              </div>
            </DialogHeader>

            {member ? (
              <div className="space-y-5 px-6 py-5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-canvas-cool px-4 py-3">
                  <Avatar initials={initials} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="pl-0.5 text-[12.5px] font-semibold text-slate-700">Roles</p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => {
                      const checked = roleEnabled(option.role);
                      return (
                        <RoleOptionCard
                          key={option.role}
                          label={option.label}
                          description={option.description}
                          checked={checked}
                          disabled={pending || isSelf}
                          onToggle={() => setRoleEnabled(option.role, !checked)}
                        />
                      );
                    })}
                  </div>
                  {isSelf ? (
                    <p className="text-xs text-slate-500">You cannot change your own access from this screen.</p>
                  ) : null}
                </div>

                {error ? <p className="text-sm font-semibold text-danger-press">{error}</p> : null}
              </div>
            ) : null}

            <DialogFooter
              className={cn(
                '-mx-0 -mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4',
                showRevoke ? 'sm:justify-between' : 'sm:justify-end'
              )}
            >
              {showRevoke ? (
                <Button variant="danger" size="sm" onClick={() => setView('revoke-confirm')} disabled={pending}>
                  Revoke access
                </Button>
              ) : null}
              <Button
                variant="primary"
                onClick={handleSave}
                loading={pending}
                loadingLabel="Saving…"
                disabled={isSelf || !member || (inactive && !hasSelectedRole)}
              >
                Save changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleOptionCard({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-120',
        checked
          ? 'border-brand bg-[#EEF0FF] shadow-[inset_0_0_0_1px_rgba(92,101,207,0.08)]'
          : 'border-slate-200 bg-white hover:border-slate-300',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors',
            checked ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white'
          )}
        >
          {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
        </span>
      </div>
      <span className="text-[11.5px] leading-snug text-slate-500">{description}</span>
    </button>
  );
}

export function formatStaffName(member: Pick<StaffMember, 'first_name' | 'last_name' | 'email'>): string {
  const parts = [member.first_name, member.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  const local = member.email.split('@')[0] ?? member.email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function staffInitials(member: Pick<StaffMember, 'first_name' | 'last_name' | 'email'>): string {
  const first = member.first_name?.trim();
  const last = member.last_name?.trim();
  if (first && last) {
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  const local = member.email.split('@')[0] ?? member.email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
