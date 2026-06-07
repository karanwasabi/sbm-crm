import { cn } from '@/lib/cn';

type AvatarProps = {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'white';
  className?: string;
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-[84px] w-[84px] text-[30px] border-4 border-white/40',
};

export function Avatar({ initials, size = 'md', tone = 'brand', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-extrabold',
        sizeClasses[size],
        tone === 'brand' ? 'bg-brand-deep text-white' : 'bg-white text-brand',
        className
      )}
    >
      {initials}
    </div>
  );
}
