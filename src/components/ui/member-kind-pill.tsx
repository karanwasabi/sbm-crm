type MemberKind = 'renewal' | 'returnee';

type MemberKindPillProps = {
  kind: MemberKind;
  className?: string;
};

const STYLES: Record<MemberKind, { background: string; color: string }> = {
  returnee: { background: '#CCFBF1', color: '#0F766E' },
  renewal: { background: '#FFEDD5', color: '#C2410C' },
};

const LABELS: Record<MemberKind, string> = {
  returnee: 'Returnee',
  renewal: 'Renewal',
};

export function MemberKindPill({ kind, className }: MemberKindPillProps) {
  const style = STYLES[kind];
  return (
    <span
      className={
        className ??
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase'
      }
      style={{ background: style.background, color: style.color }}
    >
      <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: style.color }} />
      {LABELS[kind]}
    </span>
  );
}
