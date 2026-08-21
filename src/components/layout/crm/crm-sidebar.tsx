'use client';

import { usePathname } from 'next/navigation';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { CrmNavLink } from '@/components/layout/crm/crm-nav-link';
import { CRM_NAV_GROUPS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

type CrmSidebarProps = {
  isSuperadmin?: boolean;
  isMarketing?: boolean;
  isMarketingPlus?: boolean;
};

export function CrmSidebar({ isSuperadmin = false, isMarketing = false, isMarketingPlus = false }: CrmSidebarProps) {
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
              {group.items
                .filter((item) => {
                  if (item.superadminOnly && !isSuperadmin) return false;
                  if (isMarketing) {
                    if (item.marketingAllowed) return true;
                    if (isMarketingPlus && item.marketingPlusAllowed) return true;
                    return false;
                  }
                  return true;
                })
                .map(({ id, href, label, icon: Icon }) => {
                  const active = isNavActive(pathname, href);

                  return <CrmNavLink key={id} href={href} label={label} icon={Icon} active={active} />;
                })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
