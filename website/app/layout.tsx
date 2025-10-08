import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import StructuredData from '@/components/StructuredData'

const inter = Inter({ subsets: ['latin'] })

const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://safeprompt.dev';

export const metadata: Metadata = {
  title: 'SafePrompt - Stop Prompt Injection in One Line of Code',
  description: 'Protect your AI applications from prompt injection attacks with simple, transparent, developer-first security. Network defense learns from attacks across all users for collective intelligence.',
  keywords: 'prompt injection, ai security, chatgpt security, llm security, api security, network defense, IP reputation, threat intelligence, collective security',
  authors: [{ name: 'SafePrompt' }],
  icons: {
    icon: '/favicon.webp',
    shortcut: '/favicon.webp',
    apple: '/favicon.webp',
  },
  openGraph: {
    title: 'SafePrompt - Stop Prompt Injection in One Line of Code',
    description: 'Protect your AI applications from prompt injection attacks. Network defense learns from attacks across all users for collective intelligence.',
    url: websiteUrl,
    siteName: 'SafePrompt',
    images: [
      {
        url: `${websiteUrl}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafePrompt - Stop Prompt Injection in One Line of Code',
    description: 'Protect your AI applications from prompt injection attacks. Network defense learns from attacks across all users for collective intelligence.',
    images: [`${websiteUrl}/og-image.png`],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
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

        <StructuredData type="organization" />
        <StructuredData type="product" />
        <StructuredData type="faq" />
        <div className="grid-background fixed inset-0 z-0" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}