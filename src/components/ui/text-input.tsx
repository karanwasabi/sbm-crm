'use client';

import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react';
import { cn } from '@/lib/cn';

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    value,
    onChange,
    placeholder,
    type = 'text',
    leftIcon,
    rightIcon,
    disabled,
    autoComplete,
    autoFocus,
    error = false,
    className,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(Boolean(autoFocus));

  const iconColorClass = error ? 'text-danger-press' : focused ? 'text-brand' : 'text-slate-400';

  return (
    <div
      className={cn(
        'relative flex items-center rounded-2xl border-[1.5px] transition-all duration-120',
        disabled ? 'bg-slate-50' : 'bg-white',
        error ? 'border-danger-press' : focused ? 'border-brand' : 'border-slate-200',
        className
      )}
    >
      {leftIcon && <div className={cn('flex pr-0.5 pl-3.5', iconColorClass)}>{leftIcon}</div>}
      <input
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={error || undefined}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          'min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-slate-800 outline-none',
          leftIcon ? 'py-3.25 pr-4 pl-2.5' : 'px-4 py-3.25'
        )}
      />
      {rightIcon && <div className={cn('flex pr-3.5 pl-1', iconColorClass)}>{rightIcon}</div>}
    </div>
  );
});
