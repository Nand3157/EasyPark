import React from 'react';
import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'EasyPark | Smart Parking & Real-Time Availability',
  description: 'Find, compare, and reserve parking spaces with real-time navigation and live availability.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
