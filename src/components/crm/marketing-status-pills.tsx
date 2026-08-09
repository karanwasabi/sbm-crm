import { Pill } from '@/components/ui/pill';
import {
  marketingCampaignKindLabel,
  marketingHealthHint,
  marketingHealthLabel,
  marketingHealthTone,
} from '@/lib/marketing-campaign-taxonomy';

type MarketingKindPillProps = {
  kind: string;
  className?: string;
};

export function MarketingKindPill({ kind, className }: MarketingKindPillProps) {
  return (
    <Pill tone="neutral" className={className}>
      {marketingCampaignKindLabel(kind)}
    </Pill>
  );
}

type MarketingHealthPillProps = {
  health: string;
  className?: string;
};

export function MarketingHealthPill({ health, className }: MarketingHealthPillProps) {
  const tone = marketingHealthTone(health);
  const hint = marketingHealthHint(health);
  return (
    <span title={hint || undefined} className="inline-flex">
      <Pill tone={tone} className={className}>
        {marketingHealthLabel(health)}
      </Pill>
    </span>
  );
}
