'use client';

import dynamic from 'next/dynamic';
import { EmailTemplateEditorSkeleton } from '@/components/loading/comms-page-skeletons';

export const GrapesMjmlEditor = dynamic(
  () => import('@/components/comms/grapes-mjml-editor').then((mod) => mod.GrapesMjmlEditor),
  {
    ssr: false,
    loading: () => <EmailTemplateEditorSkeleton />,
  }
);
