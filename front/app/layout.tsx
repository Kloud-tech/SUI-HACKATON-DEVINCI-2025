import type React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Bangers } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './global.css';
import { Providers } from './providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const bangers = Bangers({ subsets: ['latin'], weight: '400', variable: '--font-bangers' });

export const metadata: Metadata = {
  title: 'Rare Egg Collection - NFT Marketplace',
  description: 'Discover the most exclusive digital eggs in the metaverse',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${bangers.variable} ${geist.variable} ${geistMono.variable}`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
