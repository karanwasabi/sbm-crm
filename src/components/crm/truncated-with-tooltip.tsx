'use client';

import { Copy, Check } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
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

type OverflowTooltipProps = {
  text: string;
  className?: string;
  children: ReactNode;
  measureRef: RefObject<HTMLElement | null>;
  overflowing: boolean;
};

function OverflowTooltip({ text, className, children, measureRef, overflowing }: OverflowTooltipProps) {
  if (!overflowing || !text.trim()) {
    return (
      <div ref={measureRef as RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  return (
    <Tooltip disableHoverablePopup={false}>
      <TooltipTrigger
        delay={200}
        closeDelay={100}
        render={(props) => (
          <div
            {...props}
            ref={mergeRefs(measureRef, props.ref)}
            className={cn('cursor-default', className, props.className)}
          >
            {children}
          </div>
        )}
      />
      <TooltipContent side="top" align="start">
        <CopyableTooltipBody text={text} />
      </TooltipContent>
    </Tooltip>
  );
}

type TruncatedWithTooltipProps = {
  text: string;
  className?: string;
};

export function TruncatedWithTooltip({ text, className }: TruncatedWithTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const syncOverflow = useCallback(() => {
    const element = ref.current;
    if (!element || !text.trim()) {
      setOverflowing(false);
      return;
    }
    setOverflowing(isOverflowing(element));
  }, [text]);

  useEffect(() => {
    syncOverflow();
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(syncOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [syncOverflow]);

  return (
    <OverflowTooltip text={text} className={cn('truncate', className)} measureRef={ref} overflowing={overflowing}>
      {text}
    </OverflowTooltip>
  );
}

type TruncatedContainerTooltipProps = {
  tooltip: string;
  className?: string;
  children: ReactNode;
};

export function TruncatedContainerTooltip({ tooltip, className, children }: TruncatedContainerTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const syncOverflow = useCallback(() => {
    const element = ref.current;
    if (!element || !tooltip.trim()) {
      setOverflowing(false);
      return;
    }
    setOverflowing(isOverflowing(element));
  }, [tooltip]);

  useEffect(() => {
    syncOverflow();
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(syncOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [syncOverflow, children]);

  return (
    <OverflowTooltip text={tooltip} className={className} measureRef={ref} overflowing={overflowing}>
      {children}
    </OverflowTooltip>
  );
}
