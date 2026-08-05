'use client';

import { useEffect, useState } from 'react';
import { getWhatsAppUnreadSummaryAction } from '@/app/(crm)/actions';
import { ConvoniteIcon } from '@/components/icons/convonite-icon';

type CrmWhatsAppUnreadBadgeProps = {
  sendsEnabled: boolean;
};

const POLL_MS = 120_000;

export function CrmWhatsAppUnreadBadge({ sendsEnabled }: CrmWhatsAppUnreadBadgeProps) {
  const [count, setCount] = useState(0);
  const [inboxUrl, setInboxUrl] = useState('https://on.convonite.com');

  useEffect(() => {
    if (!sendsEnabled) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const result = await getWhatsAppUnreadSummaryAction();
      if (cancelled) return;
      if (result.summary) {
        setCount(result.summary.count);
        setInboxUrl(result.summary.inboxUrl);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sendsEnabled]);

  if (!sendsEnabled || count <= 0) {
    return null;
  }

  return (
    <a
      href={inboxUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex h-9 items-center gap-1.5 rounded-full border border-slate-100 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-200"
      title="Open Convonite inbox"
    >
      <ConvoniteIcon className="h-4 w-4" />
      <span className="hidden sm:inline">WhatsApp</span>
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-extrabold text-white tabular-nums">
        {count > 99 ? '99+' : count}
      </span>
    </a>
  );
}
