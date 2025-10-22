'use client';

import { useEffect } from 'react';
import Script from 'next/script';

// AI: Client-side only Google Analytics component
// Prevents hydration errors by running gtag initialization only after mount
// Strategy: Load script with afterInteractive, then initialize in useEffect
export default function GoogleAnalytics() {
  useEffect(() => {
    // Only runs on client after hydration
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('js', new Date());
      window.gtag('config', 'G-9P2ZF4JYJN');
    }
  }, []);

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-9P2ZF4JYJN"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
        `}
      </Script>
    </>
  );
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
