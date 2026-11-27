import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { LifestyleAuditView } from '@/components/views/lifestyle-audit-view';
import { isCRMAdmin } from '@/lib/access';
import {
  getLifestyleAuditSchedule,
  getMyAccess,
  listEmailTemplates,
  listLifestyleAuditBookings,
  listLifestyleAuditCoachOptions,
  listWhatsAppTemplates,
} from '@/utils/api';

export default async function LifestyleAuditPage() {
  const access = await getMyAccess();
  if (!isCRMAdmin(access.roles)) {
    redirect('/unauthorized');
  }

  const [schedule, coaches, bookings, emailTemplates, whatsappTemplates] = await Promise.all([
    getLifestyleAuditSchedule().catch(() => ({
      settings: {
        pricePaise: 75000,
        durationMinutes: 40,
        timezone: 'Asia/Kolkata',
        operatingWeekdays: [1, 2, 3, 4, 5, 6],
        bookingHorizonDays: 21,
        holdTtlMinutes: 15,
        confirmationEmailTemplateId: null,
        confirmationWhatsappTemplateId: null,
      },
      slots: [],
    })),
    listLifestyleAuditCoachOptions().catch(() => []),
    listLifestyleAuditBookings({ limit: 50, offset: 0 }).catch(() => ({
      bookings: [],
      total: 0,
      limit: 50,
      offset: 0,
    })),
    listEmailTemplates().catch(() => []),
    listWhatsAppTemplates().catch(() => []),
  ]);

  return (
    <CrmPageLayout>
      <LifestyleAuditView
        initialSchedule={schedule}
        coaches={coaches}
        initialBookings={bookings}
        emailTemplates={emailTemplates.map((t) => ({ id: t.id, name: t.name, status: t.status }))}
        whatsappTemplates={whatsappTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          status: String(t.status),
        }))}
      />
    </CrmPageLayout>
  );
}
