import { CrmPageTransition } from '@/components/layout/crm/crm-page-transition';

export default function CrmTemplate({ children }: { children: React.ReactNode }) {
  return <CrmPageTransition>{children}</CrmPageTransition>;
}
