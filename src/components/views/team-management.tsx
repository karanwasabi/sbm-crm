'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { grantRoleAction, revokeRoleAction } from '@/app/(crm)/settings/team-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import type { AppRole } from '@/lib/access';
import type { StaffRoleRow } from '@/utils/api';

const ASSIGNABLE_ROLES: AppRole[] = ['admin', 'coach', 'member'];

type TeamManagementProps = {
  initialRows: StaffRoleRow[];
};

export function TeamManagement({ initialRows }: TeamManagementProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleGrant = () => {
    setError(null);
    startTransition(async () => {
      try {
        await grantRoleAction(email.trim(), role);
        setEmail('');
        router.refresh();
      } catch (grantError) {
        setError(grantError instanceof Error ? grantError.message : 'Failed to grant role.');
      }
    });
  };

  const handleRevoke = (userId: string, assignedRole: AppRole) => {
    setError(null);
    startTransition(async () => {
      try {
        await revokeRoleAction(userId, assignedRole);
        setRows((current) => current.filter((row) => !(row.user_id === userId && row.role === assignedRole)));
        router.refresh();
      } catch (revokeError) {
        setError(revokeError instanceof Error ? revokeError.message : 'Failed to revoke role.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHead title="Grant access" subtitle="Assign admin, coach, or member roles by email" />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Email">
            <TextInput
              value={email}
              onChange={setEmail}
              placeholder="person@example.com"
              type="email"
              disabled={pending}
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              disabled={pending}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800"
            >
              {ASSIGNABLE_ROLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Button onClick={handleGrant} disabled={pending || !email.trim()}>
            Grant role
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-danger-press">{error}</p> : null}
      </Card>

      <Card>
        <SectionHead title="Staff roles" subtitle="Active admin and coach assignments" />
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No staff roles assigned yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={`${row.user_id}-${row.role}`}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{row.email}</div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {row.role} · granted {new Date(row.granted_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="light"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleRevoke(row.user_id, row.role)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
