import './globals.css';

import type { Metadata } from 'next';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'mediasoup-demo (Next + oRPC + TanStack Query)',
  description: 'Rewritten app scaffold with oRPC + TanStack Query + Bun + Next.js + TailwindCSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
