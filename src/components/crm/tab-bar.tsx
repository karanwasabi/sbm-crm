'use client';

import { cn } from '@/lib/cn';

type TabBarProps = {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
};

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'cursor-pointer rounded-[14px] px-4 py-2 text-[13px] font-semibold transition-colors',
            active === tab ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
