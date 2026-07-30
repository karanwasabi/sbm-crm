import { cn } from '@/lib/cn';

type ConvoniteIconProps = {
  className?: string;
};

export function ConvoniteIcon({ className }: ConvoniteIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn('h-3.5 w-3.5 shrink-0 text-white', className)}
      aria-hidden
    >
      <g fill="currentColor">
        <circle cx="100" cy="38" r="22" />
        <path d="M 48,76 H 152 a 10,10 0 0 1 8.8,14.8 L 141.5,116 H 58.5 L 39.2,90.8 A 10,10 0 0 1 48,76 Z" />
        <path d="M 67.8,136 H 132.2 L 104.5,180 a 5,5 0 0 1 -9,0 Z" />
      </g>
    </svg>
  );
}
