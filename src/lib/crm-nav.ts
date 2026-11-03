import { CRM_NAV_GROUPS, type CrmNavItem } from '@/lib/navigation';

export function isCrmNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function filterCrmNavItems(
  items: CrmNavItem[],
  opts: { isSuperadmin: boolean; isMarketing: boolean; isMarketingPlus: boolean }
) {
  return items.filter((item) => {
    if (item.superadminOnly && !opts.isSuperadmin) return false;
    if (opts.isMarketing) {
      if (item.marketingAllowed) return true;
      if (opts.isMarketingPlus && item.marketingPlusAllowed) return true;
      return false;
    }
    return true;
  });
}

export function getFilteredCrmNavGroups(opts: {
  isSuperadmin: boolean;
  isMarketing: boolean;
  isMarketingPlus: boolean;
}) {
  return CRM_NAV_GROUPS.map((group) => ({
    ...group,
    items: filterCrmNavItems(group.items, opts),
  })).filter((group) => group.items.length > 0);
}
