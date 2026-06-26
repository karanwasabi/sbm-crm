'use client';

import { Copy, Globe, Key, Share2 } from 'lucide-react';
import { useState } from 'react';
import { IntegrationCard } from '@/components/crm/integration-card';
import { TabBar } from '@/components/crm/tab-bar';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { buildMetaIntegrationCard } from '@/lib/meta-integration';
import { PurgeAuditPanel } from '@/components/views/purge-audit-view';
import { TeamManagement } from '@/components/views/team-management';
import type { MetaIntegrationStatus } from '@/types/crm';
import type { PurgeAuditListItem, StaffList } from '@/utils/api';

const SETTINGS_TABS = ['Integrations', 'Webhooks', 'Team', 'Purge audit'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function resolveSettingsTab(tab?: string): SettingsTab {
  if (tab === 'purge-audit' || tab === 'Purge audit') return 'Purge audit';
  if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) return tab as SettingsTab;
  return 'Integrations';
}

type SettingsViewProps = {
  staff: StaffList;
  currentUserId: string;
  integrationStatus: MetaIntegrationStatus;
  initialTab?: string;
  purgeAuditItems: PurgeAuditListItem[];
  purgeAuditTotal: number;
};

export function SettingsView({
  staff,
  currentUserId,
  integrationStatus,
  initialTab,
  purgeAuditItems,
  purgeAuditTotal,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => resolveSettingsTab(initialTab));
  const [copied, setCopied] = useState(false);

  const metaCard = buildMetaIntegrationCard(integrationStatus);

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(integrationStatus.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <CrmPageLayout>
      <TabBar tabs={[...SETTINGS_TABS]} active={activeTab} onChange={(tab) => setActiveTab(tab as SettingsTab)} />

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
            name="Razorpay"
            subtitle="Payments + subscriptions"
            icon={Globe}
            color="#0EA5E9"
            status="connected"
          />
        </div>
      )}

      {activeTab === 'Webhooks' && (
        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead
              title="Lead ingestion endpoint"
              subtitle="POST JSON payloads to create leads from an external source"
            />
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
              <code className="flex-1 text-xs break-all text-slate-700">{integrationStatus.webhookUrl}</code>
              <Button variant="light" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={handleCopyWebhook}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {integrationStatus.webhookConfigured
                ? 'Webhook auth is configured on the backend.'
                : 'Set LEAD_INGESTION_API_KEY on the backend before sending webhook requests.'}
            </p>
          </Card>
          <Card>
            <SectionHead title="API key" subtitle="Send as Authorization: Bearer … with webhook requests" />
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Key className="h-4 w-4 text-brand" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">Lead ingestion API key</div>
                  <div className="font-mono text-[11px] text-slate-500">Managed in backend environment</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Team' && <TeamManagement staff={staff} currentUserId={currentUserId} />}

      {activeTab === 'Purge audit' && <PurgeAuditPanel initialItems={purgeAuditItems} total={purgeAuditTotal} />}
    </CrmPageLayout>
  );
}
