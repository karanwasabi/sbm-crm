'use client';

import { useState } from 'react';
import { PromoCreateDialog } from '@/components/promos/promo-create-dialog';
import { PromosListView } from '@/components/views/promos-list-view';
import { Button } from '@/components/ui/button';
import type { PromoListItem } from '@/utils/api';

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
      <PromoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <PromosListView items={items} />
    </>
  );
}
