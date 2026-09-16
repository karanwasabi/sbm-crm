'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  clearLeadMealPlanBracketOverrideAction,
  getLeadMemberProfileAction,
  putLeadMealPlanBracketOverrideAction,
} from '@/app/(crm)/customers/actions';
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
import { useToast } from '@/components/ui/toast';
import { MEAL_PLAN_WEIGHT_BRACKETS, mealPlanWeightBracketLabel } from '@/lib/meal-plan-weight-brackets';

type MealPlanBracketOverrideDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function MealPlanBracketOverrideDialog({
  leadId,
  open,
  onOpenChange,
  onDone,
}: MealPlanBracketOverrideDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [derived, setDerived] = useState('');
  const [hasOverride, setHasOverride] = useState(false);
  const [selected, setSelected] = useState('55_60');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result, error } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        setDerived(result.derivedWeightBracket);
        setHasOverride(Boolean(result.mealPlanWeightBracketOverride));
        setSelected(result.mealPlanWeightBracketOverride || result.effectiveWeightBracket || '55_60');
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
    startTransition(async () => {
      const { result, error } = await putLeadMealPlanBracketOverrideAction(leadId, selected);
      if (error || !result) {
        toast({ message: error ?? 'Unknown error', variant: 'error' });
        return;
      }
      const s = result.servings;
      toast({
        message: s
          ? `Bracket override set to ${mealPlanWeightBracketLabel(result.effectiveWeightBracket)}. Active week rebuilt · P${s.protein}/F${s.fiber}/S${s.starch}/D${s.dairy}/Fun${s.fun}`
          : `Bracket override set for week ${result.weekStartDate}`,
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      const { result, error } = await clearLeadMealPlanBracketOverrideAction(leadId);
      if (error || !result) {
        toast({ message: error ?? 'Unknown error', variant: 'error' });
        return;
      }
      const s = result.servings;
      toast({
        message: s
          ? `Override cleared · using ${mealPlanWeightBracketLabel(result.effectiveWeightBracket)}. Active week rebuilt · P${s.protein}/F${s.fiber}/S${s.starch}/D${s.dairy}/Fun${s.fun}`
          : `Override cleared for week ${result.weekStartDate}`,
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
          <DialogTitle>Meal-plan weight bracket</DialogTitle>
          <DialogDescription>
            Forces servings and meal generation to a bracket without changing logged weight. Saving rebuilds this
            week&apos;s nutrition plan and clears saved meal plans.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500">
            Weight-derived bracket: {derived ? mealPlanWeightBracketLabel(derived) : '—'}
          </p>
          <Field label="Override bracket">
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={selected}
              disabled={loadingProfile || pending}
              onChange={(e) => setSelected(e.target.value)}
            >
              {MEAL_PLAN_WEIGHT_BRACKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current values…</p> : null}
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          {hasOverride ? (
            <Button variant="ghost" onClick={handleClear} disabled={pending || loadingProfile}>
              {pending ? 'Working…' : 'Clear override'}
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={pending || loadingProfile}>
            {pending ? 'Saving…' : 'Save & rebuild'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
