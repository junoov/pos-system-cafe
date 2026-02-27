import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'POS System Cafe',
  description: 'POS kasir cafe berbasis Next.js + MySQL',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-brand-50 min-h-screen text-ui-text selection:bg-brand-200 selection:text-brand-950`}>
        {children}
      </body>
    </html>
  );
}
