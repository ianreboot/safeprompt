import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import EnvironmentBanner from '@/components/EnvironmentBanner'
import { GoogleAnalytics } from '@next/third-parties/google'
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
        <GoogleAnalytics gaId="G-9P2ZF4JYJN" />
        <EnvironmentBanner />
        {children}
      </body>
    </html>
  )
}