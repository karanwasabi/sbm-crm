'use client';

import { Calendar, Globe, Mail, Phone, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StagePill } from '@/components/ui/stage-pill';
import type { CustomerProfile } from '@/types/crm';

type ProfileHeaderProps = {
  customer: CustomerProfile;
  onLogCall?: () => void;
};

export function ProfileHeader({ customer, onLogCall }: ProfileHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border-b-[6px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]">
      <div aria-hidden className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
      <div className="relative z-1 flex items-center gap-5.5">
        <Avatar initials={customer.initials} size="lg" tone="white" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] font-extrabold tracking-tight">{customer.name}</h2>
            <StagePill stage={customer.stage} />
            <span className="inline-flex items-center gap-1.5 rounded-full border-b-2 border-black/22 bg-black/18 px-3 py-1.25 text-[10px] font-bold tracking-[0.14em] uppercase">
              {customer.batch}
            </span>
            {customer.tags.includes('vip') && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-b-2 border-[#C28C00] bg-motivation px-3 py-1.25 text-[10px] font-bold tracking-[0.14em] text-slate-900 uppercase">
                <Star className="h-2.75 w-2.75 fill-slate-900" />
                VIP
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-5.5 text-xs opacity-92">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              {customer.email}
            </span>
            <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-white no-underline">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              {customer.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Joined {customer.joinedAt}
            </span>
          </div>
          <div className="mt-3.5 inline-flex items-center gap-4.5 rounded-2xl border-b-2 border-black/22 bg-black/16 px-4.5 py-3">
            <div>
              <div className="text-[22px] font-extrabold">{customer.clv}</div>
              <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Lifetime value</div>
            </div>
            <div className="h-7.5 w-px bg-white/25" />
            <div>
              <div className="text-[22px] font-extrabold">{customer.programs}</div>
              <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Programs</div>
            </div>
            <div className="h-7.5 w-px bg-white/25" />
            <div>
              <div className="text-[22px] font-extrabold">{customer.loggingPct}%</div>
              <div className="text-[9px] tracking-[0.16em] uppercase opacity-80">Logging</div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button variant="light" size="sm" leftIcon={<Phone className="h-3.5 w-3.5" />}>
            Call
          </Button>
          <Button variant="light" size="sm" onClick={onLogCall}>
            Log call
          </Button>
        </div>
      </div>
    </div>
  );
}
