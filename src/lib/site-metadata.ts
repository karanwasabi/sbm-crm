import type { Metadata } from 'next';

const SITE_NAME = 'Slow Burn Method CRM';
const SITE_DESCRIPTION =
  'Internal CRM for Slow Burn Method staff — leads, members, enrollments, and program operations.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const BRAND_ICONS = {
  icon: [
    { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/brand/favicon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  shortcut: '/brand/favicon-32.png',
} satisfies Metadata['icons'];

const OG_IMAGE = {
  url: '/brand/og-image.png',
  width: 2426,
  height: 520,
  alt: 'Slow Burn Method',
};

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['Slow Burn Method', 'SBM', 'CRM', 'leads', 'member management', 'staff portal'],
  authors: [{ name: 'Slow Burn Method', url: 'https://slowburnmethod.in' }],
  creator: 'Slow Burn Method',
  publisher: 'Slow Burn Method',
  category: 'business',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: BRAND_ICONS,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  alternates: {
    canonical: SITE_URL,
  },
};
