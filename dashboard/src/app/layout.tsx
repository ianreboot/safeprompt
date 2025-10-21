import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import EnvironmentBanner from '@/components/EnvironmentBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafePrompt Dashboard',
  description: 'Manage your API keys and monitor usage',
  icons: {
    icon: '/favicon.webp',
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9P2ZF4JYJN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9P2ZF4JYJN');
          `}
        </Script>

        <EnvironmentBanner />
        {children}
      </body>
    </html>
  )
}