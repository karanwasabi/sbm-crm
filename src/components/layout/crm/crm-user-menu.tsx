'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOut } from '@/app/(auth)/actions';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { cn } from '@/lib/cn';

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Staff';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

type CrmUserMenuProps = {
  staffUser: CrmStaffUser;
};

export function CrmUserMenu({ staffUser }: CrmUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = displayNameFromEmail(staffUser.email);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-100 bg-white py-1 pr-2 pl-1 transition-colors hover:border-slate-200"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-deep to-motivation text-xs font-extrabold text-white">
          {staffUser.initials}
        </div>
        <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 sm:inline">
          {displayName}
        </span>
        <ChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="truncate text-sm font-bold text-slate-800">{displayName}</div>
            <div className="truncate text-xs text-slate-500">{staffUser.email}</div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400 capitalize">{staffUser.roleLabel}</div>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-canvas-cool"
          >
            <User size={16} className="text-slate-500" />
            Profile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-canvas-cool"
            >
              <LogOut size={16} className="text-slate-500" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
