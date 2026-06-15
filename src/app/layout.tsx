import type { Metadata } from 'next';
import { Geist, Poppins } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'SBM CRM',
  description: 'SBM CRM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('h-full', 'antialiased', poppins.variable, 'font-sans', geist.variable)}>
      <body className="flex min-h-dvh flex-col font-sans text-slate-900">{children}</body>
    </html>
  );
}
