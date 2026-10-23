import { formatStarRupees } from '@/lib/star-balance';

export function StarBalanceLines({
  earned,
  available,
  value,
}: {
  earned: number | null | undefined;
  available: number | null | undefined;
  value?: string | null;
}) {
  if (earned == null || available == null) {
    return <span className="text-slate-400">—</span>;
  }
  const rupees = value?.trim() || formatStarRupees(available);
  return (
    <div className="text-[11px] leading-snug text-slate-700">
      <div>Earned {earned.toLocaleString('en-IN')}</div>
      <div>Available {available.toLocaleString('en-IN')}</div>
      <div className="font-semibold">{rupees}</div>
    </div>
  );
}
