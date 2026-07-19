'use client';

import { useEffect, useState, useTransition } from 'react';
import { getLeadMemberProfileAction, putLeadServingAddonsAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import type { ServingAddons } from '@/utils/api';

type ServingAddonsDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

const FIELDS: { key: keyof ServingAddons; label: string }[] = [
  { key: 'protein', label: 'Protein' },
  { key: 'fiber', label: 'Fiber' },
  { key: 'starch', label: 'Starch' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'fun', label: 'Fun' },
];

function parseDelta(raw: string): number | null {
  const n = Number.parseFloat(raw.trim());
  if (!Number.isFinite(n) || n < -20 || n > 20) return null;
  return n;
}

function formatDelta(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function ServingAddonsDialog({ leadId, open, onOpenChange, onDone }: ServingAddonsDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [values, setValues] = useState<Record<keyof ServingAddons, string>>({
    protein: '0',
    fiber: '0',
    starch: '0',
    dairy: '0',
    fun: '0',
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result, error } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        setValues({
          protein: formatDelta(result.servingAddons.protein),
          fiber: formatDelta(result.servingAddons.fiber),
          starch: formatDelta(result.servingAddons.starch),
          dairy: formatDelta(result.servingAddons.dairy),
          fun: formatDelta(result.servingAddons.fun),
        });
      } else if (error) {
        toast({ message: error, variant: 'error' });
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, open, toast]);

  const handleSave = () => {
    const parsed: ServingAddons = {
      protein: 0,
      fiber: 0,
      starch: 0,
      dairy: 0,
      fun: 0,
    };
    for (const { key, label } of FIELDS) {
      const n = parseDelta(values[key]);
      if (n == null) {
        toast({
          message: `${label} must be a number between -20 and 20.`,
          variant: 'error',
        });
        return;
      }
      parsed[key] = n;
    }

    startTransition(async () => {
      const { result, error } = await putLeadServingAddonsAction(leadId, parsed);
      if (error || !result) {
        toast({ message: error ?? 'Unknown error', variant: 'error' });
        return;
      }
      const s = result.servings;
      toast({
        message: s
          ? `Serving addons saved. Active week rebuilt · P${s.protein}/F${s.fiber}/S${s.starch}/D${s.dairy}/Fun${s.fun}`
          : `Serving addons saved for week ${result.weekStartDate}`,
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Serving addons</DialogTitle>
          <DialogDescription>
            Permanent deltas on top of weight-bracket targets. Negatives allowed. Saving rebuilds this week&apos;s
            nutrition plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <TextInput
                type="number"
                inputMode="decimal"
                value={values[key]}
                disabled={loadingProfile || pending}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              />
            </Field>
          ))}
        </div>
        {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current values…</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending || loadingProfile}>
            {pending ? 'Saving…' : 'Save & rebuild'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
