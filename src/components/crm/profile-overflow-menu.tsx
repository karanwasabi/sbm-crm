'use client';

import {
  BadgeCheck,
  Banknote,
  GraduationCap,
  KeyRound,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Scale,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type ProfileOverflowMenuProps = {
  onPurge?: () => void;
  onEnroll?: () => void;
  onSyncPayment?: () => void;
  onMarkPaidOffline?: () => void;
  onMarkRenewal?: () => void;
  onMarkReturnee?: () => void;
  onClearMemberKind?: () => void;
  onSetPassword?: () => void;
  onVerifyEmail?: () => void;
  onForceNutritionRecalc?: () => void;
  onCorrectWeights?: () => void;
  onResetOnboardingPointA?: () => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

const menuItemClass =
  'flex w-full min-w-[12rem] cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors';

export function ProfileOverflowMenu({
  onPurge,
  onEnroll,
  onSyncPayment,
  onMarkPaidOffline,
  onMarkRenewal,
  onMarkReturnee,
  onClearMemberKind,
  onSetPassword,
  onVerifyEmail,
  onForceNutritionRecalc,
  onCorrectWeights,
  onResetOnboardingPointA,
}: ProfileOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menu =
    open && menuPosition && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              transform: 'translateX(-100%)',
            }}
            className="z-[200] min-w-[12rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]"
          >
            {onEnroll ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onEnroll();
                }}
              >
                <GraduationCap className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Enroll
              </button>
            ) : null}
            {onMarkRenewal ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onMarkRenewal();
                }}
              >
                <RotateCcw className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Mark as renewal
              </button>
            ) : null}
            {onMarkReturnee ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onMarkReturnee();
                }}
              >
                <UserRoundCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Mark as returnee
              </button>
            ) : null}
            {onClearMemberKind ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onClearMemberKind();
                }}
              >
                <RotateCcw className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                Clear renewal/returnee
              </button>
            ) : null}
            {onSyncPayment ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onSyncPayment();
                }}
              >
                <RefreshCw className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Sync payment
              </button>
            ) : null}
            {onMarkPaidOffline ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onMarkPaidOffline();
                }}
              >
                <Banknote className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Mark paid (offline)
              </button>
            ) : null}
            {onSetPassword ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onSetPassword();
                }}
              >
                <KeyRound className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Set password
              </button>
            ) : null}
            {onVerifyEmail ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onVerifyEmail();
                }}
              >
                <BadgeCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Verify email
              </button>
            ) : null}
            {onCorrectWeights ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onCorrectWeights();
                }}
              >
                <Scale className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Correct weights
              </button>
            ) : null}
            {onResetOnboardingPointA ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-amber-800 hover:bg-amber-50')}
                onClick={() => {
                  setOpen(false);
                  onResetOnboardingPointA();
                }}
              >
                <RotateCcw className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                Reset onboarding & Point A
              </button>
            ) : null}
            {onForceNutritionRecalc ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-slate-800 hover:bg-slate-50')}
                onClick={() => {
                  setOpen(false);
                  onForceNutritionRecalc();
                }}
              >
                <RefreshCw className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Recalc nutrition week
              </button>
            ) : null}
            {onPurge ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'whitespace-nowrap text-red-600 hover:bg-red-50')}
                onClick={() => {
                  setOpen(false);
                  onPurge();
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                Delete Lead
              </button>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <div ref={triggerRef}>
          <Button
            type="button"
            variant="light"
            size="sm"
            className="px-3"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="More actions"
            onClick={() => setOpen((value) => !value)}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {menu}
    </>
  );
}
