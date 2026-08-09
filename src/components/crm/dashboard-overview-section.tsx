'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const STORAGE_KEY = 'sbm-crm-dashboard-overview-collapsed';

type DashboardOverviewSectionProps = {
  children: ReactNode;
};

export function DashboardOverviewSection({ children }: DashboardOverviewSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setCollapsed(false);
    }
  }, []);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-800">Overview</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Lifecycle, revenue, and geography</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          {collapsed ? 'Show charts' : 'Hide charts'}
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed ? <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3 lg:items-stretch">{children}</div> : null}
    </Card>
  );
}
