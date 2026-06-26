'use client';

import { CheckCircle2, Mail, Radio, Users, Workflow } from 'lucide-react';
import { KpiStrip, type KpiStripItem } from '@/components/crm/kpi-strip';
import { formatHeaderDeliveryStat } from '@/lib/comms-analytics';
import type { CommsAnalytics, MarketingContactsSummary } from '@/utils/api';

type CommsHeaderStatsProps = {
  marketingSummary: MarketingContactsSummary;
  analytics: CommsAnalytics | null;
  activeAutomationCount: number;
  onOpenPerformance?: () => void;
};

function marketingAccent(percentUsed: number): string {
  if (percentUsed >= 95) return '#F43F5E';
  if (percentUsed >= 80) return '#FFB703';
  return '#5C65CF';
}

export function CommsHeaderStats({
  marketingSummary,
  analytics,
  activeAutomationCount,
  onOpenPerformance,
}: CommsHeaderStatsProps) {
  const pct = marketingSummary.limit > 0 ? Math.min(100, (marketingSummary.used / marketingSummary.limit) * 100) : 0;
  const deliveryStat = formatHeaderDeliveryStat(analytics);
  const sentCount = analytics?.totals.sent ?? null;
  const webhookEnabled = analytics?.webhookEnabled ?? false;
  const openPerformance = onOpenPerformance;

  const items: KpiStripItem[] = [
    {
      label: 'Marketing contacts',
      value: marketingSummary.used.toLocaleString('en-IN'),
      sub: `${Math.round(pct)}% of plan · ${marketingSummary.limit.toLocaleString('en-IN')} cap`,
      accent: marketingAccent(pct),
      icon: Users,
    },
    {
      label: 'Emails sent',
      value: sentCount == null ? '—' : sentCount.toLocaleString('en-IN'),
      sub: 'All time',
      accent: '#5C65CF',
      icon: Mail,
      onClick: openPerformance,
    },
    {
      label: deliveryStat.label,
      value: deliveryStat.value,
      sub: deliveryStat.label === 'Delivery rate' ? 'From Resend webhooks' : 'Accepted by Resend',
      accent: '#10B981',
      icon: CheckCircle2,
      onClick: openPerformance,
    },
    {
      label: 'Active automations',
      value: activeAutomationCount.toLocaleString('en-IN'),
      sub: 'Live nurture workflows',
      accent: '#8B5CF6',
      icon: Workflow,
    },
    {
      label: 'Webhook',
      value: analytics ? (webhookEnabled ? 'Live' : 'Not set') : '—',
      sub: webhookEnabled ? 'Delivery tracking on' : 'Configure in Performance',
      accent: webhookEnabled ? '#10B981' : '#FFB703',
      icon: Radio,
      valueClassName: webhookEnabled ? 'text-success-press' : analytics ? 'text-amber-600' : undefined,
      onClick: openPerformance,
    },
  ];

  return <KpiStrip items={items} />;
}
