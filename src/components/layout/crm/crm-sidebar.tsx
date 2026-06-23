'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { CRM_NAV_GROUPS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CrmSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col border-r border-slate-100 bg-canvas">
      <div className={cn(CRM_HEADER_ROW_CLASS, 'px-6')}>
        <SbmWordmark size="sm" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-auto px-3.5 py-4">
        {CRM_NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`}>
            {group.label && (
              <div className="mt-4 mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                {group.label}
              </div>
            )}
            {groupIndex === 0 && <div className="h-2" />}
            <nav className="flex flex-col gap-1">
              {group.items.map(({ id, href, label, icon: Icon }) => {
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
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
