import { notFound, redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { PushTemplateEditorView } from '@/components/views/push-template-editor-view';
import { isSuperadmin } from '@/lib/access';
import { ApiError, getMyAccess, getPushTemplate } from '@/utils/api';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PushTemplateEditorPage({ params }: PageProps) {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  try {
    const template = await getPushTemplate(id);
    return (
      <CrmPageLayout>
        <PushTemplateEditorView template={template} />
      </CrmPageLayout>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
