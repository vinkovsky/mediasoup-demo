import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Call (Next.js + mediasoup)',
  description: 'Minimal mediasoup call UI built with Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">Call</div>
            <div className="subtle">Next.js · oRPC · SWR · mediasoup</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

