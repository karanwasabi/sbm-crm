'use client';

import { X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { revokeStaffAccessAction, updateStaffAccessAction } from '@/app/(crm)/settings/team-actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { StaffAccessRole } from '@/lib/access';
import type { StaffMember } from '@/utils/api';

type StaffAccessModalProps = {
  member: StaffMember | null;
  currentUserId: string;
  inactive?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function StaffAccessModal({ member, currentUserId, inactive = false, onClose, onSaved }: StaffAccessModalProps) {
  const [admin, setAdmin] = useState(false);
  const [coach, setCoach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isSelf = member?.user_id === currentUserId;
  const showRevoke = !inactive && !isSelf;

  useEffect(() => {
    if (!member) return;
    setAdmin(member.roles.includes('admin'));
    setCoach(member.roles.includes('coach'));
    setError(null);
  }, [member]);

  if (!member) return null;

  const displayName = formatStaffName(member);

  const selectedRoles = (): StaffAccessRole[] => {
    const roles: StaffAccessRole[] = [];
    if (admin) roles.push('admin');
    if (coach) roles.push('coach');
    return roles;
  };

  const handleSave = () => {
    const roles = selectedRoles();
    if (roles.length === 0) {
      setError('Select at least one role.');
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

  const handleRevoke = () => {
    if (
      !window.confirm(
        `Revoke all access for ${displayName}? They will remain a staff account but lose admin and coach roles.`
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await revokeStaffAccessAction(member.user_id);
        onSaved();
        onClose();
      } catch (revokeError) {
        setError(revokeError instanceof Error ? revokeError.message : 'Failed to revoke access.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">{inactive ? 'Grant access' : 'Edit access'}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{displayName}</p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent p-1 text-slate-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Checkbox checked={admin} onChange={setAdmin} disabled={pending || isSelf} label="Admin" />
          <Checkbox checked={coach} onChange={setCoach} disabled={pending || isSelf} label="Coach" />
          {isSelf ? (
            <p className="text-xs text-slate-500">You cannot change your own access from this screen.</p>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm font-semibold text-danger-press">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex justify-end gap-2">
            <Button variant="light" onClick={onClose} disabled={pending}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={pending || isSelf}>
              Save changes
            </Button>
          </div>
          {showRevoke ? (
            <Button variant="danger" onClick={handleRevoke} disabled={pending} fullWidth>
              Revoke access
            </Button>
          ) : null}
        </div>
      </div>
    </div>
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
