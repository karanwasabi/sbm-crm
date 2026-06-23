'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useTransition } from 'react';
import { createPromoTermAction, deactivatePromoAction, deletePromoAction } from '@/app/(crm)/promos/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import {
  PromoOfferDisplay,
  PromoUsageCountCell,
  PromoUsageCountHeader,
  PromoWindowDisplay,
} from '@/components/promos/promo-display-cells';
import { PromoSummaryCard } from '@/components/promos/promo-summary-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { useToast } from '@/components/ui/toast';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import type { PromoDetail, PromoTerm, PromoTermInput } from '@/utils/api';

const PromoNewTermDialog = dynamic(
  () => import('@/components/promos/promo-new-term-dialog').then((module) => ({ default: module.PromoNewTermDialog })),
  { ssr: false }
);

type PromoDetailViewProps = {
  promo: PromoDetail;
};

function formatInrFromPaise(paise: number | null | undefined): string {
  if (paise == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

function statusTone(status: string) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'scheduled':
      return 'warn' as const;
    default:
      return 'neutral' as const;
  }
}

function promoCount(value: number | null | undefined): number {
  return value ?? 0;
}

function PromoHistoryTableRow({ term }: { term: PromoTerm }) {
  return (
    <DataTableRow>
      <DataTableCell>
        <PromoOfferDisplay discountType={term.discount_type} discountValue={term.discount_value} />
      </DataTableCell>
      <DataTableCell>
        <PromoWindowDisplay startsAt={term.starts_at} endsAt={term.ends_at} />
      </DataTableCell>
      <DataTableCell>
        <Pill tone={statusTone(term.status)}>{term.status}</Pill>
      </DataTableCell>
      <PromoUsageCountCell className="w-28 min-w-28">{promoCount(term.applied_count)}</PromoUsageCountCell>
      <PromoUsageCountCell className="w-28 min-w-28">{promoCount(term.redeemed_count)}</PromoUsageCountCell>
    </DataTableRow>
  );
}

export function PromoDetailView({ promo }: PromoDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewTermDialog, setShowNewTermDialog] = useState(false);
  const current = promo.current_term ?? promo.terms[0];
  const pastTerms = promo.terms.filter((term) => term.id !== current?.id);
  const usageCount = promo.usages.length;
  const canDelete = promo.summary.status === 'ended' && usageCount === 0;
  const isActive = promo.summary.status === 'active' || promo.summary.status === 'scheduled';

  const handleCreateTerm = async (input: PromoTermInput) => {
    await createPromoTermAction(promo.id, input);
    toast({
      message: promo.summary.status === 'ended' ? `${promo.code} is active again.` : 'New promo term created.',
      variant: 'success',
    });
    router.refresh();
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      try {
        await deactivatePromoAction(promo.id);
        toast({ message: 'Promo deactivated.', variant: 'success' });
        setShowDeleteConfirm(false);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to deactivate promo.',
          variant: 'error',
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePromoAction(promo.id);
        setShowDeleteConfirm(false);
        toast({ message: `Deleted promo ${promo.code}.`, variant: 'success' });
        router.push('/promos');
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to delete promo.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <CrmPageLayout className="mx-auto max-w-6xl">
      <div className="space-y-5">
        <Link
          href="/promos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to promo codes
        </Link>

        {showNewTermDialog ? (
          <PromoNewTermDialog
            open={showNewTermDialog}
            onOpenChange={setShowNewTermDialog}
            sourceTerm={current}
            onSubmit={handleCreateTerm}
            description={
              promo.summary.status === 'ended'
                ? 'Reactivate this promo code with a new term. You can adjust the offer before confirming.'
                : 'Create a new term with an updated offer. The current term will be closed automatically.'
            }
            confirmLabel={promo.summary.status === 'ended' ? 'Activate term' : 'Create term'}
          />
        ) : null}

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
              <DialogTitle className="text-lg font-bold text-slate-900">Delete promo code?</DialogTitle>
              <DialogDescription className="sr-only">Confirm permanent deletion of this promo code</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600">
                Permanently delete <span className="font-semibold text-slate-800">{promo.code}</span>? This action
                cannot be undone.
              </p>
            </div>
            <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="light"
                size="sm"
                disabled={pending}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={pending}
                loadingLabel="Deleting…"
                onClick={handleDelete}
              >
                Delete permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PromoSummaryCard
          promo={promo}
          current={current}
          pending={pending}
          onStartNewTerm={() => setShowNewTermDialog(true)}
          onDeactivate={handleDeactivate}
          onDelete={() => setShowDeleteConfirm(true)}
          canDelete={canDelete}
          isActive={isActive}
        />

        {pastTerms.length > 0 ? (
          <Card className="p-5">
            <SectionHead title="History" subtitle="Previous offer terms and usage." />
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Offer</DataTableHeaderCell>
                  <DataTableHeaderCell>Window (IST)</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <PromoUsageCountHeader className="w-28 min-w-28">Applied</PromoUsageCountHeader>
                  <PromoUsageCountHeader className="w-28 min-w-28">Redeemed</PromoUsageCountHeader>
                </DataTableHead>
                <DataTableBody>
                  {pastTerms.map((term) => (
                    <PromoHistoryTableRow key={term.id} term={term} />
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </Card>
        ) : null}

        {usageCount > 0 ? (
          <Card className="p-5">
            <SectionHead title="Checkout usage" subtitle="Individual applications linked to a term." />
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Member</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell>Applied</DataTableHeaderCell>
                  <DataTableHeaderCell>Redeemed</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">Discount</DataTableHeaderCell>
                </DataTableHead>
                <DataTableBody>
                  {promo.usages.map((usage) => (
                    <DataTableRow key={usage.id}>
                      <DataTableCell>{usage.user_email || '—'}</DataTableCell>
                      <DataTableCell>
                        <Pill
                          tone={
                            usage.status === 'redeemed' ? 'success' : usage.status === 'applied' ? 'warn' : 'neutral'
                          }
                        >
                          {usage.status}
                        </Pill>
                      </DataTableCell>
                      <DataTableCell className="text-xs text-slate-600">
                        {formatDateTimeIST(usage.applied_at)}
                      </DataTableCell>
                      <DataTableCell className="text-xs text-slate-600">
                        {formatDateTimeIST(usage.redeemed_at)}
                      </DataTableCell>
                      <DataTableCell className="text-right">{formatInrFromPaise(usage.discount_paise)}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </Card>
        ) : null}
      </div>
    </CrmPageLayout>
  );
}
