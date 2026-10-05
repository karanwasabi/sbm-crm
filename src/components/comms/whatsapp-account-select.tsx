'use client';

import { useMemo } from 'react';
import { AutomationBuilderSelect } from '@/components/comms/automation-builder-select';
import { whatsAppAccountLabel } from '@/lib/whatsapp-account';
import type { WhatsAppAccount } from '@/utils/api';

type WhatsAppAccountSelectProps = {
  accounts: WhatsAppAccount[];
  value: string;
  onChange: (accountId: string) => void;
  disabled?: boolean;
  accountLocked?: boolean;
  className?: string;
};

export function WhatsAppAccountSelect({
  accounts,
  value,
  onChange,
  disabled = false,
  accountLocked = false,
  className,
}: WhatsAppAccountSelectProps) {
  const options = useMemo(
    () =>
      accounts
        .filter((account) => account.active)
        .map((account) => ({
          value: account.id,
          label: whatsAppAccountLabel(account),
        })),
    [accounts]
  );

  if (options.length === 0) {
    return <p className="text-sm font-medium text-slate-500">No WhatsApp accounts configured.</p>;
  }

  return (
    <AutomationBuilderSelect
      className={className}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select WhatsApp account…"
      disabled={disabled || accountLocked || options.length <= 1}
    />
  );
}
