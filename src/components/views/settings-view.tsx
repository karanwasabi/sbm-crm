'use client';

import { Globe, Share2 } from 'lucide-react';
import { useState } from 'react';
import { IntegrationCard } from '@/components/crm/integration-card';
import { ProfileView } from '@/components/profile/profile-view';
import { TabBar } from '@/components/crm/tab-bar';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { buildMetaIntegrationCard } from '@/lib/meta-integration';
import { buildRazorpayIntegrationCard } from '@/lib/razorpay-integration';
import { PurgeAuditPanel } from '@/components/views/purge-audit-view';
import { TeamManagement } from '@/components/views/team-management';
import type { MetaIntegrationStatus, RazorpayIntegrationStatus } from '@/types/crm';
import type { PurgeAuditListItem, StaffList } from '@/utils/api';
import type { Country } from '@/types/reference';

const SETTINGS_TABS = ['Profile', 'Team', 'Integrations', 'Purge audit'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function resolveSettingsTab(tab?: string): SettingsTab {
  if (tab === 'purge-audit' || tab === 'Purge audit') return 'Purge audit';
  if (tab === 'Webhooks') return 'Integrations';
  if (tab?.toLowerCase() === 'profile') return 'Profile';
  if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) return tab as SettingsTab;
  return 'Profile';
}

type SettingsViewProps = {
  countries: Country[];
  staff: StaffList;
  currentUserId: string;
  integrationStatus: MetaIntegrationStatus;
  razorpayStatus: RazorpayIntegrationStatus;
  initialTab?: string;
  purgeAuditItems: PurgeAuditListItem[];
  purgeAuditTotal: number;
};

export function SettingsView({
  countries,
  staff,
  currentUserId,
  integrationStatus,
  razorpayStatus,
  initialTab,
  purgeAuditItems,
  purgeAuditTotal,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => resolveSettingsTab(initialTab));

  const metaCard = buildMetaIntegrationCard(integrationStatus);
  const razorpayCard = buildRazorpayIntegrationCard(razorpayStatus);

  return (
    <CrmPageLayout>
      <TabBar tabs={[...SETTINGS_TABS]} active={activeTab} onChange={(tab) => setActiveTab(tab as SettingsTab)} />

      {activeTab === 'Profile' && <ProfileView countries={countries} />}

      {activeTab === 'Team' && <TeamManagement staff={staff} currentUserId={currentUserId} />}

      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IntegrationCard
            name={metaCard.name}
            subtitle={metaCard.subtitle}
            icon={Share2}
            color={metaCard.color}
            status={metaCard.status}
          />
          <IntegrationCard
            name={razorpayCard.name}
            subtitle={razorpayCard.subtitle}
            icon={Globe}
            color={razorpayCard.color}
            status={razorpayCard.status}
          />
        </div>
      )}

      {activeTab === 'Purge audit' && <PurgeAuditPanel initialItems={purgeAuditItems} total={purgeAuditTotal} />}
    </CrmPageLayout>
  );
}
