'use client';

import { Globe, MessageCircle, QrCode, Share2 } from 'lucide-react';
import { useState } from 'react';
import { InboundLog } from '@/components/crm/inbound-log';
import { IntegrationCard } from '@/components/crm/integration-card';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { MOCK_INBOUND_LOG, MOCK_INTEGRATIONS } from '@/lib/mock/lead-intake';

const INTEGRATION_ICONS = {
  meta: Share2,
  whatsapp: MessageCircle,
  website: Globe,
  google: Globe,
};

export function LeadIntakeView() {
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <CrmPageLayout>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <SectionHead title="Manual lead entry" subtitle="Offline events, walk-ins, IG DMs" />
          <Eyebrow className="mb-3">New lead</Eyebrow>
          <form className="flex flex-col gap-3.5">
            <Field label="Full name">
              <TextInput value={name} onChange={setName} placeholder="Full name" />
            </Field>
            <Field label="Email">
              <TextInput value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
            </Field>
            <Field label="Phone">
              <TextInput value={phone} onChange={setPhone} placeholder="+91 …" />
            </Field>
            <Checkbox
              checked={consent}
              onChange={setConsent}
              label="I confirm this contact has given explicit consent to be contacted (DPDP Act)."
            />
            <Button variant="primary" disabled={!consent || !name || !email}>
              Save lead
            </Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead title="Integration health" subtitle="Inbound sources" />
            <div className="flex flex-col gap-2.5">
              {MOCK_INTEGRATIONS.map((integration) => {
                const Icon = INTEGRATION_ICONS[integration.id as keyof typeof INTEGRATION_ICONS] ?? Globe;
                return (
                  <IntegrationCard
                    key={integration.id}
                    name={integration.name}
                    subtitle={integration.subtitle}
                    icon={Icon}
                    color={integration.color}
                    status={integration.status}
                  />
                );
              })}
            </div>
          </Card>
          <InboundLog leads={MOCK_INBOUND_LOG} />
        </div>
      </div>

      <Card>
        <SectionHead
          title="QR code generator"
          subtitle="Link to landing page for event capture"
          right={<QrCode className="h-5 w-5 text-brand" />}
        />
        <div className="flex items-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-canvas-cool">
            <QrCode className="h-16 w-16 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Take Control enquiry page</p>
            <p className="mt-1 text-xs text-slate-500">slowburnmethod.com/enquire?utm_source=event</p>
            <Button variant="light" size="sm" className="mt-3">
              Download PNG
            </Button>
          </div>
        </div>
      </Card>
    </CrmPageLayout>
  );
}
