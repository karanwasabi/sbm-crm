'use client';

import dynamic from 'next/dynamic';
import { AutomationBuilderSkeleton } from '@/components/loading/comms-page-skeletons';
import type { AutomationBuilderProps } from '@/components/comms/automation-builder';

const LazyAutomationBuilder = dynamic(
  () => import('@/components/comms/automation-builder').then((module) => ({ default: module.AutomationBuilder })),
  {
    ssr: false,
    loading: () => <AutomationBuilderSkeleton />,
  }
);

export function AutomationBuilder(props: AutomationBuilderProps) {
  return <LazyAutomationBuilder {...props} />;
}
