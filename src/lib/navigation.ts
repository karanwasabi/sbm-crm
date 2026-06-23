import {
  Calendar,
  Database,
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
  '/leads': { title: 'Lead Intake', subtitle: 'Capture and route inbound leads' },
  '/database': { title: 'Lead Database' },
  '/programs': { title: 'Program Management', subtitle: 'Cohorts, capacity & attendance' },
  '/communications': { title: 'Communications', subtitle: 'Rules, templates & sequences' },
  '/renewals': { title: 'Renewals & Retention', subtitle: '28 renewals due in 14 days' },
  '/promos': { title: 'Promo Codes', subtitle: 'Discount terms, usage & audit trail' },
  '/settings': { title: 'Settings', subtitle: 'Integrations, webhooks & team' },
};

export function getPageMeta(pathname: string): CrmPageMeta {
  if (pathname.startsWith('/customers/')) {
    return { title: 'Customer 360', subtitle: 'Unified contact profile' };
  }
  if (pathname.startsWith('/promos/')) {
    return { title: 'Promo Detail', subtitle: 'Terms, history & usage' };
  }
  return CRM_PAGES[pathname] ?? { title: 'CRM' };
}
