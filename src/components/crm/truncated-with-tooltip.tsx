'use client';

import { Copy, Check } from 'lucide-react';
import { useRef, useState, type MouseEvent, type MutableRefObject, type ReactNode, type Ref } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

function isOverflowing(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }
  };
}

function CopyableTooltipBody({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures (permissions, insecure context).
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs leading-relaxed break-words text-slate-700 select-text">{text}</p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 self-end rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-brand transition-colors hover:bg-slate-100"
      >
        {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

type TruncatedWithTooltipProps = {
  text: string;
  className?: string;
};

/** Truncation tooltip measured on open — avoids per-cell ResizeObservers on dense tables. */
export function TruncatedWithTooltip({ text, className }: TruncatedWithTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  if (!text.trim()) {
    return <div className={cn('truncate', className)}>{text}</div>;
  }

  return (
    <Tooltip
      disableHoverablePopup={false}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpen(false);
          return;
        }
        const element = ref.current;
        setOpen(Boolean(element && isOverflowing(element)));
      }}
    >
      <TooltipTrigger
        delay={200}
        closeDelay={100}
        render={(props) => (
          <div
            {...props}
            ref={mergeRefs(ref, props.ref)}
            className={cn('cursor-default truncate', className, props.className)}
          >
            {text}
          </div>
        )}
      />
      <TooltipContent side="top" align="start">
        <CopyableTooltipBody text={text} />
      </TooltipContent>
    </Tooltip>
  );
}

type TruncatedContainerTooltipProps = {
  tooltip: string;
  className?: string;
  children: ReactNode;
};

export function TruncatedContainerTooltip({ tooltip, className, children }: TruncatedContainerTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  if (!tooltip.trim()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Tooltip
      disableHoverablePopup={false}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpen(false);
          return;
        }
        const element = ref.current;
        setOpen(Boolean(element && isOverflowing(element)));
      }}
    >
      <TooltipTrigger
        delay={200}
        closeDelay={100}
        render={(props) => (
          <div {...props} ref={mergeRefs(ref, props.ref)} className={cn('cursor-default', className, props.className)}>
            {children}
          </div>
        )}
      />
      <TooltipContent side="top" align="start">
        <CopyableTooltipBody text={tooltip} />
      </TooltipContent>
    </Tooltip>
  );
}
