import Image from 'next/image';
import { cn } from '@/lib/cn';

type SbmWordmarkProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light';
  className?: string;
};

const sizeConfig = {
  sm: { logo: 28, title: 'text-[13px]', subtitle: 'text-[8.5px]' },
  md: { logo: 36, title: 'text-sm', subtitle: 'text-[9px]' },
  lg: { logo: 56, title: 'text-[19px]', subtitle: 'text-[11px]' },
} as const;

export function SbmWordmark({ size = 'md', tone = 'dark', className }: SbmWordmarkProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', size === 'lg' ? 'gap-3.5' : 'gap-2.5', className)}>
      <Image
        src="/images/sbm-logo-circle.png"
        alt="Slow Burn Method"
        width={config.logo}
        height={config.logo}
        className={cn(tone === 'light' && 'brightness-0 invert')}
        priority
      />
      <div className="leading-tight">
        <div
          className={cn('font-extrabold tracking-wide', config.title, tone === 'light' ? 'text-white' : 'text-brand')}
        >
          SLOW BURN METHOD
        </div>
        <div
          className={cn(
            'mt-0.5 font-semibold tracking-[0.16em] uppercase',
            config.subtitle,
            tone === 'light' ? 'text-white/75' : 'text-slate-500'
          )}
        >
          CRM
        </div>
      </div>
    </div>
  );
}
