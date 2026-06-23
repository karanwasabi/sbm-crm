import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { siteMetadata } from '@/lib/site-metadata';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('h-full', 'antialiased', poppins.variable, 'font-sans')}>
      <body className="flex min-h-dvh flex-col font-sans text-slate-900">{children}</body>
    </html>
  );
}
