'use client';

import { type ButtonHTMLAttributes, type ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'light' | 'ghost' | 'success' | 'danger' | 'amber';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, { base: string; lip: string; pressedLip: string; shadow: string }> = {
  primary: {
    base: 'bg-brand text-white',
    lip: 'border-b-brand-press',
    pressedLip: 'border-b-brand',
    shadow: 'shadow-brand',
  },
  light: {
    base: 'bg-white text-brand',
    lip: 'border-b-slate-200',
    pressedLip: 'border-b-white',
    shadow: 'shadow-sm',
  },
  ghost: {
    base: 'bg-transparent text-slate-700',
    lip: 'border-b-transparent',
    pressedLip: 'border-b-transparent',
    shadow: '',
  },
  success: {
    base: 'bg-success text-white',
    lip: 'border-b-success-press',
    pressedLip: 'border-b-success',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(16,185,129,0.30)]',
  },
  danger: {
    base: 'bg-danger text-white',
    lip: 'border-b-danger-press',
    pressedLip: 'border-b-danger',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(244,63,94,0.30)]',
  },
  amber: {
    base: 'bg-motivation text-slate-900',
    lip: 'border-b-[#C28C00]',
    pressedLip: 'border-b-motivation',
    shadow: 'shadow-[0_8px_14px_-4px_rgba(255,183,3,0.30)]',
  },
};

const sizeClasses: Record<ButtonSize, { base: string; lip: string; pressOffset: string }> = {
  sm: {
    base: 'rounded-2xl px-4 py-2.25 text-xs',
    lip: 'border-b-[3px]',
    pressOffset: 'translate-y-0.5',
  },
  md: {
    base: 'rounded-[20px] px-5 py-2.75 text-[13.5px]',
    lip: 'border-b-4',
    pressOffset: 'translate-y-[3px]',
  },
  lg: {
    base: 'rounded-3xl px-6 py-4 text-[15px]',
    lip: 'border-b-[5px]',
    pressOffset: 'translate-y-1',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const variantStyle = variantClasses[disabled ? 'ghost' : variant];
  const sizeStyle = sizeClasses[size];
  const isPressed = pressed && !disabled;

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled) setPressed(true);
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
        'inline-flex cursor-pointer items-center justify-center gap-2 border-x-0 border-t-0 font-semibold transition-all duration-100 outline-none',
        sizeStyle.base,
        sizeStyle.lip,
        fullWidth && 'w-full',
        disabled
          ? 'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
          : cn(
              variantStyle.base,
              isPressed ? variantStyle.pressedLip : variantStyle.lip,
              isPressed ? 'shadow-none' : variantStyle.shadow,
              isPressed && sizeStyle.pressOffset
            ),
        className
      )}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
