'use client';

import { useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type FiltersSheetProps = {
  activeCount?: number;
  children: ReactNode;
  title?: string;
};

/** Mobile-only entry that opens filter controls in a sheet. Hidden at `lg+`. */
export function FiltersSheet({ activeCount = 0, children, title = 'Filters' }: FiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="light"
        size="sm"
        className="h-11 shrink-0 gap-2 px-3"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-[min(100vw,420px)]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-3">{children}</SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
