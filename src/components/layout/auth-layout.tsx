import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden bg-linear-to-br from-brand-deep from-0% via-brand via-60% to-[#6A71E6] p-6">
      <div aria-hidden="true" className="absolute -top-10 -right-10 h-80 w-80 rounded-full bg-white/18 blur-[50px]" />
      <div
        aria-hidden="true"
        className="absolute -bottom-22 -left-15 h-70 w-70 rounded-full bg-motivation opacity-40 blur-[60px]"
      />
      <div className="relative z-1 w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-[0_24px_48px_-12px_rgba(43,24,101,0.35)] sm:p-10">
        {children}
      </div>
    </div>
  );
}
