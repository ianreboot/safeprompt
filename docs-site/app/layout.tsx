import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafePrompt Documentation - API Reference & Guides',
  description: 'Complete documentation for SafePrompt prompt injection protection API. Quick start guides, API reference, and code examples.',
  keywords: 'safeprompt docs, prompt injection api, ai security documentation, llm security guide',
  icons: {
    icon: 'https://safeprompt.dev/favicon.webp',
    shortcut: 'https://safeprompt.dev/favicon.webp',
    apple: 'https://safeprompt.dev/favicon.webp',
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
