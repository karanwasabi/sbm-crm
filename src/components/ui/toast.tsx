'use client';

import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'default';

type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastOptions & {
  id: string;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; iconClassName: string; cardClassName: string }> =
  {
    success: {
      icon: CheckCircle2,
      iconClassName: 'text-success-press',
      cardClassName: 'border-emerald-300 bg-[#DCFCE7] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]',
    },
    error: {
      icon: CircleAlert,
      iconClassName: 'text-danger-press',
      cardClassName: 'border-rose-300 bg-[#FEE2E5] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]',
    },
    warning: {
      icon: CircleAlert,
      iconClassName: 'text-[#92400E]',
      cardClassName: 'border-amber-400 bg-[#FEF3C7] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]',
    },
    default: {
      icon: CircleAlert,
      iconClassName: 'text-slate-600',
      cardClassName: 'border-slate-300 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]',
    },
  };

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, iconClassName, cardClassName } = variantStyles[item.variant ?? 'default'];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3',
        cardClassName,
        'animate-in duration-200 fade-in slide-in-from-bottom-4'
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconClassName)} aria-hidden />
      <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, variant = 'default', durationMs = 4000 }: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant, durationMs }]);

      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex flex-col items-center gap-2 px-4">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
