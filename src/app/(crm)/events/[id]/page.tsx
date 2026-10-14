import { notFound, redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { EventDetailView } from '@/components/views/event-detail-view';
import { isSuperadmin } from '@/lib/access';
import { getEvent, getMyAccess, listEventRegistrations } from '@/utils/api';

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  let event;
  let registrations;
  try {
    [event, registrations] = await Promise.all([getEvent(id), listEventRegistrations(id)]);
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout>
      <EventDetailView event={event} registrations={registrations} />
    </CrmPageLayout>
  );
}
