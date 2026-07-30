'use client';

import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, type ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';

export type TCButtonGradient = 'call' | 'email' | 'whatsapp' | 'convonite';
export type TCButtonSize = 'sm' | 'md';

type TCButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  gradient: TCButtonGradient;
  size?: TCButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
};

const gradientStyles: Record<TCButtonGradient, { face: string; lip: string; pressedLip: string; shadow: string }> = {
  call: {
    face: 'bg-linear-to-b from-sky-400 to-sky-600 text-white',
    lip: 'border-b-sky-800',
    pressedLip: 'border-b-sky-600',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(14,165,233,0.32)]',
  },
  email: {
    face: 'bg-linear-to-b from-indigo-500 to-violet-600 text-white',
    lip: 'border-b-violet-900',
    pressedLip: 'border-b-violet-600',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(99,102,241,0.32)]',
  },
  whatsapp: {
    face: 'bg-linear-to-b from-emerald-500 to-green-600 text-white',
    lip: 'border-b-green-800',
    pressedLip: 'border-b-green-600',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(16,185,129,0.32)]',
  },
  convonite: {
    face: 'bg-linear-to-b from-[#4f5ef4] to-[#2B3DF2] text-white',
    lip: 'border-b-[#1f2db8]',
    pressedLip: 'border-b-[#2B3DF2]',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(43,61,242,0.32)]',
  },
};

const sizeClasses: Record<TCButtonSize, { base: string; lip: string; pressOffset: string }> = {
  sm: {
    base: 'rounded-2xl px-3.5 py-2 text-[11px]',
    lip: 'border-b-[3px]',
    pressOffset: 'translate-y-0.5',
  },
  md: {
    base: 'rounded-[20px] px-5 py-2.75 text-[13px]',
    lip: 'border-b-4',
    pressOffset: 'translate-y-[3px]',
  },
};

export function TCButton({
  children,
  gradient,
  size = 'sm',
  leftIcon,
  rightIcon,
  fullWidth,
  loading = false,
  loadingLabel,
  disabled,
  className,
  type = 'button',
  ...props
}: TCButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const style = gradientStyles[gradient];
  const sizeStyle = sizeClasses[size];
  const isPressed = pressed && !isDisabled;
  const label = loading ? (loadingLabel ?? children) : children;
  const showLeftSlot = !loading && leftIcon != null;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerDown={(e) => {
        if (!isDisabled) setPressed(true);
        props.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        props.onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        props.onPointerLeave?.(e);
      }}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 border-x-0 border-t-0 font-bold transition-all duration-100 outline-none',
        sizeStyle.base,
        sizeStyle.lip,
        fullWidth && 'w-full',
        isDisabled && !loading
          ? 'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
          : cn(
              style.face,
              isPressed ? style.pressedLip : style.lip,
              isPressed ? 'shadow-none' : style.shadow,
              isPressed && sizeStyle.pressOffset
            ),
        loading && 'cursor-wait',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : showLeftSlot ? (
        <span
          className="flex h-3.5 shrink-0 items-center justify-center [&_img]:h-3.5 [&_img]:w-auto [&_svg]:h-3.5 [&_svg]:w-3.5"
          aria-hidden
        >
          {leftIcon}
        </span>
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
      {!loading && rightIcon ? rightIcon : null}
    </button>
  );
}
