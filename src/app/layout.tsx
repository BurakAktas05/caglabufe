import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { CustomerShell } from '@/components/CustomerShell';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { NetworkStatus } from '@/components/NetworkStatus';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://caglabufe.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Çağla Büfe & Market | Karabük & KYK Hızlı Sipariş',
    template: '%s | Çağla Büfe Karabük',
  },
  description:
    'Karabük 100. Yıl ve KYK yurtlarına 15-20 dakikada soğuk içecek, atıştırmalık, cips, çikolata ve gece market teslimatı. Kapıda nakit ve POS ile ödeme kolaylığı.',
  keywords: [
    'karabük sipariş',
    'kyk market',
    'karabük büfe',
    '100. yıl gece market',
    'çağla büfe karabük',
    'hubbi hatun kyk sipariş',
    'bahaddin gazi kyk',
    'karabük üniversitesi hızlı market',
  ],
  authors: [{ name: 'Çağla Büfe & Market' }],
  creator: 'Çağla Büfe',
  manifest: '/manifest.json',
  applicationName: 'Çağla Büfe',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Çağla Büfe',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Çağla Büfe & Market | Karabük & KYK Hızlı Sipariş',
    description: '100. Yıl ve KYK Yurtlarına 15-20 dakikada soğuk içecek, atıştırmalık ve gece market kapında!',
    url: siteUrl,
    siteName: 'Çağla Büfe & Market',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Çağla Büfe & Market | Karabük & KYK Hızlı Sipariş',
    description: '100. Yıl ve KYK Yurtlarına 15-20 dakikada gece paket teslimatı.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Accessible responsive viewport - locked to device-width with safe-area support
export const viewport: Viewport = {
  themeColor: '#5D3EBC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        {/* iOS Splash Startup Screens fallback */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
      </head>
      <body className={plusJakartaSans.className}>
        <AppProvider>
          <ServiceWorkerRegister />
          <NetworkStatus />
          {children}
          <CustomerShell />
        </AppProvider>
      </body>
    </html>
  );
}
