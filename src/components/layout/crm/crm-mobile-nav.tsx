'use client';

import { usePathname } from 'next/navigation';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { CrmNavLink } from '@/components/layout/crm/crm-nav-link';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getFilteredCrmNavGroups, isCrmNavActive } from '@/lib/crm-nav';

type CrmMobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperadmin?: boolean;
  isMarketing?: boolean;
  isMarketingPlus?: boolean;
};

export function CrmMobileNav({
  open,
  onOpenChange,
  isSuperadmin = false,
  isMarketing = false,
  isMarketingPlus = false,
}: CrmMobileNavProps) {
  const pathname = usePathname();
  const groups = getFilteredCrmNavGroups({ isSuperadmin, isMarketing, isMarketingPlus });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="max-w-[280px] bg-canvas" showCloseButton>
        <SheetHeader className="border-slate-100 bg-canvas pr-12">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SbmWordmark size="sm" />
        </SheetHeader>
        <SheetBody className="flex flex-col gap-1.5 bg-canvas px-3.5 py-4">
          {groups.map((group, groupIndex) => (
            <div key={group.label ?? `group-${groupIndex}`}>
              {group.label ? (
                <div className="mt-4 mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  {group.label}
                </div>
              ) : null}
              {groupIndex === 0 ? <div className="h-2" /> : null}
              <nav className="flex flex-col gap-1">
                {group.items.map(({ id, href, label, icon: Icon }) => (
                  <CrmNavLink
                    key={id}
                    href={href}
                    label={label}
                    icon={Icon}
                    active={isCrmNavActive(pathname, href)}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </nav>
            </div>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
