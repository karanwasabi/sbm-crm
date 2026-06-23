'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { PromosListView } from '@/components/views/promos-list-view';
import { Button } from '@/components/ui/button';
import type { PromoListItem } from '@/utils/api';

const PromoCreateDialog = dynamic(
  () => import('@/components/promos/promo-create-dialog').then((module) => ({ default: module.PromoCreateDialog })),
  { ssr: false }
);

type PromosPageClientProps = {
  items: PromoListItem[];
};

export function PromosPageClient({ items }: PromosPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          New promo code
        </Button>
      </div>
      {createOpen ? <PromoCreateDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
      <PromosListView items={items} />
    </>
  );
}
