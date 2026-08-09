import { humanizeMarketingLabel } from '@/lib/marketing-labels';

type MarketingLabelCellProps = {
  value: string;
  secondary?: string;
  className?: string;
};

export function MarketingLabelCell({ value, secondary, className }: MarketingLabelCellProps) {
  const raw = value.trim();
  if (!raw) {
    return <span className="text-slate-400">—</span>;
  }

  const label = humanizeMarketingLabel(raw);
  const showSecondary = secondary?.trim() && secondary.trim() !== raw && secondary.trim() !== label;

  return (
    <div className={className} title={raw}>
      <span className="block text-[13px] leading-snug break-words whitespace-normal">{label}</span>
      {showSecondary ? (
        <span className="mt-0.5 block text-[11px] break-words whitespace-normal text-slate-400">{secondary}</span>
      ) : null}
    </div>
  );
}
