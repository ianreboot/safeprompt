import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafePrompt - Stop Prompt Injection in One Line of Code',
  description: 'Protect your AI applications from prompt injection attacks with simple, transparent, developer-first security.',
  keywords: 'prompt injection, ai security, chatgpt security, llm security, api security',
  authors: [{ name: 'SafePrompt' }],
  openGraph: {
    title: 'SafePrompt - Stop Prompt Injection in One Line of Code',
    description: 'Protect your AI applications from prompt injection attacks.',
    url: 'https://safeprompt.dev',
    siteName: 'SafePrompt',
    images: [
      {
        url: 'https://safeprompt.dev/og-image.png',
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
    description: 'Protect your AI applications from prompt injection attacks.',
    images: ['https://safeprompt.dev/og-image.png'],
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
        <div className="grid-background fixed inset-0 z-0" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}