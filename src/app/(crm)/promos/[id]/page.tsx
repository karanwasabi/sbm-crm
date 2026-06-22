import { notFound } from 'next/navigation';
import { PromoDetailView } from '@/components/views/promo-detail-view';
import { getPromoCode } from '@/utils/api';

type PromoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PromoDetailPage({ params }: PromoDetailPageProps) {
  const { id } = await params;

  try {
    const promo = await getPromoCode(id);
    return <PromoDetailView promo={promo} />;
  } catch {
    notFound();
  }
}
