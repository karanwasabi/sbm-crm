'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import type { RefObject } from 'react';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

type PasswordFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  autoComplete: string;
  disabled: boolean;
  error: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  tabIndex?: number;
};

export function PasswordField({
  name,
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  autoComplete,
  disabled,
  error,
  inputRef,
  autoFocus,
  tabIndex,
}: PasswordFieldProps) {
  return (
    <Field label={label}>
      <TextInput
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        disabled={disabled}
        leftIcon={<Lock className="h-4 w-4" />}
        error={error}
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            onClick={onToggleShow}
            className="flex cursor-pointer border-none bg-transparent p-0"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    </Field>
  );
}
