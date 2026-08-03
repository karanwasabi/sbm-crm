import {
  Bell,
  Calendar,
  Database,
  FileText,
  LayoutDashboard,
  Library,
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
  superadminOnly?: boolean;
  marketingAllowed?: boolean;
};

export type CrmPageMeta = {
  title: string;
  subtitle?: string;
};

export const CRM_NAV_GROUPS: { label?: string; items: CrmNavItem[] }[] = [
  {
    items: [
      { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'leads', href: '/leads', label: 'Lead Intake', icon: UserPlus, marketingAllowed: true },
      { id: 'database', href: '/database', label: 'Lead Database', icon: Database, marketingAllowed: true },
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
      {
        id: 'resources',
        href: '/resources',
        label: 'Resource Manager',
        icon: Library,
        superadminOnly: true,
      },
      {
        id: 'push-notifications',
        href: '/push-notifications',
        label: 'Push notifications',
        icon: Bell,
        superadminOnly: true,
      },
      { id: 'settings', href: '/settings', label: 'Settings', icon: Settings, marketingAllowed: true },
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
  '/resources': { title: 'Resource Manager', subtitle: 'Library content & cohort assignments' },
  '/push-notifications': {
    title: 'Push notifications',
    subtitle: 'Habit nudge templates & cohort assignment',
  },
  '/settings': { title: 'Settings', subtitle: 'Profile, team, integrations & purge audit' },
};

/** Canonical staff profile UI lives under Settings → Profile. */
export const SETTINGS_PROFILE_HREF = '/settings?tab=Profile';

export function getPageMeta(pathname: string): CrmPageMeta {
  if (pathname.startsWith('/reports/')) {
    return CRM_PAGES['/reports'];
  }
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
  if (pathname.startsWith('/push-notifications/')) {
    return { title: 'Push template', subtitle: 'Week × day × slot copy' };
  }
  return CRM_PAGES[pathname] ?? { title: 'CRM' };
}
