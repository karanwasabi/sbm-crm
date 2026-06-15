'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { Avatar } from '@/components/ui/avatar';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { CRM_NAV_GROUPS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

type CrmSidebarProps = {
  staffUser: CrmStaffUser;
};

export function CrmSidebar({ staffUser }: CrmSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col gap-1.5 border-r border-slate-100 bg-canvas px-3.5 py-5.5">
      <div className="mb-1 flex items-center border-b border-slate-100 px-2.5 pb-4">
        <SbmWordmark size="sm" />
      </div>

      {CRM_NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`}>
          {group.label && (
            <div className="mt-4 mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              {group.label}
            </div>
          )}
          {groupIndex === 0 && <div className="h-2" />}
          <nav className="flex flex-col gap-1">
            {group.items.map(({ id, href, label, icon: Icon, badge, badgeTone }) => {
              const active = isNavActive(pathname, href);

              return (
                <Link
                  key={id}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'border-b-[3px] border-b-brand-press bg-brand font-bold text-white shadow-[0_8px_14px_-6px_rgba(92,101,207,0.40)]'
                      : 'border-b-[3px] border-transparent text-slate-700 hover:bg-white/60'
                  )}
                >
                  <Icon size={17} className={active ? 'text-white' : 'text-slate-500'} />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        active
                          ? 'bg-white/22 text-white'
                          : badgeTone === 'amber'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="mt-auto">
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3">
          <Avatar initials={staffUser.initials} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-slate-800">{staffUser.email}</div>
            <div className="truncate text-[10px] text-slate-500 capitalize">{staffUser.roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
