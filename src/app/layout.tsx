import type { Metadata } from 'next';
import './globals.css';
import { siteMetadata } from '@/lib/site-metadata';
import { cn } from '@/lib/utils';

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('h-full', 'antialiased', 'font-sans')}>
      <body className="flex min-h-dvh flex-col font-sans text-slate-900">{children}</body>
    </html>
  );
}
