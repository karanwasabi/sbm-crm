import {
  Calendar,
  Database,
  FileText,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  Tag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

export type CrmNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export type CrmPageMeta = {
  title: string;
  subtitle?: string;
};

export const CRM_NAV_GROUPS: { label?: string; items: CrmNavItem[] }[] = [
  {
    items: [
      { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'leads', href: '/leads', label: 'Lead Intake', icon: UserPlus },
      { id: 'database', href: '/database', label: 'Lead Database', icon: Database },
      { id: 'programs', href: '/programs', label: 'Program Management', icon: Calendar },
      { id: 'communications', href: '/communications', label: 'Communications', icon: MessageSquare },
      { id: 'renewals', href: '/renewals', label: 'Renewals', icon: RefreshCw },
      { id: 'reports', href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Setup',
    items: [
      { id: 'promos', href: '/promos', label: 'Promo Codes', icon: Tag },
      { id: 'settings', href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const CRM_PAGES: Record<string, CrmPageMeta> = {
  '/': { title: 'Dashboard', subtitle: 'Reporting & performance overview' },
  '/leads': { title: 'Lead Intake', subtitle: 'Manual intake, public forms & Meta inbound' },
  '/database': { title: 'Lead Database' },
  '/programs': { title: 'Program Management', subtitle: 'Cohort queue, phases & members' },
  '/communications': { title: 'Communications', subtitle: 'Rules, templates & sequences' },
  '/renewals': { title: 'Renewals & Retention', subtitle: 'Subscription retention monitoring' },
  '/reports': { title: 'Reports', subtitle: 'Published report snapshots' },
  '/promos': { title: 'Promo Codes', subtitle: 'Discount terms, usage & audit trail' },
  '/settings': { title: 'Settings', subtitle: 'Profile, team, integrations & purge audit' },
};

/** Canonical staff profile UI lives under Settings → Profile. */
export const SETTINGS_PROFILE_HREF = '/settings?tab=Profile';

export function getPageMeta(pathname: string): CrmPageMeta {
  if (pathname.startsWith('/communications/')) {
    return CRM_PAGES['/communications'];
  }
  if (pathname.startsWith('/programs/cohorts/')) {
    return { title: 'Cohort Detail', subtitle: 'Members & transfers' };
  }
  if (pathname.startsWith('/customers/')) {
    return { title: 'Customer 360', subtitle: 'Unified contact profile' };
  }
  if (pathname.startsWith('/promos/')) {
    return { title: 'Promo Detail', subtitle: 'Terms, history & usage' };
  }
  return CRM_PAGES[pathname] ?? { title: 'CRM' };
}
