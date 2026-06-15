'use client';

import { Copy, Globe, Key, Share2 } from 'lucide-react';
import { useState } from 'react';
import { IntegrationCard } from '@/components/crm/integration-card';
import { TabBar } from '@/components/crm/tab-bar';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { MOCK_API_KEYS, MOCK_SETTINGS_INTEGRATIONS, MOCK_WEBHOOK_URL } from '@/lib/mock/settings';
import { TeamManagement } from '@/components/views/team-management';
import type { StaffRoleRow } from '@/utils/api';

const INTEGRATION_ICONS: Record<string, typeof Globe> = {
  meta: Share2,
  razorpay: Globe,
  convonite: Globe,
  resend: Globe,
  google: Globe,
  zoom: Globe,
};

export function SettingsView({ teamRows }: { teamRows: StaffRoleRow[] }) {
  const [activeTab, setActiveTab] = useState('Integrations');

  return (
    <CrmPageLayout>
      <TabBar tabs={['Integrations', 'Webhooks', 'Team']} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MOCK_SETTINGS_INTEGRATIONS.map((integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              subtitle={integration.subtitle}
              icon={INTEGRATION_ICONS[integration.id] ?? Globe}
              color={integration.color}
              status={integration.status}
            />
          ))}
        </div>
      )}

      {activeTab === 'Webhooks' && (
        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead title="Lead ingestion endpoint" subtitle="POST JSON payloads to create leads" />
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
              <code className="flex-1 text-xs text-slate-700">{MOCK_WEBHOOK_URL}</code>
              <Button variant="light" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />}>
                Copy
              </Button>
            </div>
          </Card>
          <Card>
            <SectionHead title="API key vault" subtitle="Rotate keys from this panel" />
            <div className="flex flex-col gap-2">
              {MOCK_API_KEYS.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Key className="h-4 w-4 text-brand" />
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{apiKey.label}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {apiKey.masked ? apiKey.key.replace(/x+/, '••••••••') : apiKey.key}
                      </div>
                    </div>
                  </div>
                  <Button variant="light" size="sm">
                    Reveal
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Team' && <TeamManagement initialRows={teamRows} />}
    </CrmPageLayout>
  );
}
