import Link from 'next/link';
import { PromosListView } from '@/components/views/promos-list-view';
import { listPromoCodes } from '@/utils/api';

export default async function PromosPage() {
  let items: Awaited<ReturnType<typeof listPromoCodes>> = [];
  try {
    items = await listPromoCodes();
  } catch {
    items = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Link
          href="/promos/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-brand-press"
        >
          New promo code
        </Link>
      </div>
      <PromosListView items={items} />
    </div>
  );
}
