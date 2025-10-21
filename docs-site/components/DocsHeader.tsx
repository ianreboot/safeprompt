'use client'

import Link from 'next/link'
import { useState } from 'react'
import LogoText from './LogoText'

export default function DocsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="https://safeprompt.dev" className="flex items-center space-x-2">
            <LogoText size="md" />
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition">
              Docs
            </Link>
            <Link href="/quick-start" className="text-muted-foreground hover:text-foreground transition">
              Quick Start
            </Link>
            <Link href="/api-reference" className="text-muted-foreground hover:text-foreground transition">
              API Reference
            </Link>
            <Link href="https://dashboard.safeprompt.dev" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Dashboard
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-border pt-4">
            <Link
              href="/"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/quick-start"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Quick Start
            </Link>
            <Link
              href="/api-reference"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              API Reference
            </Link>
            <Link
              href="https://dashboard.safeprompt.dev"
              className="block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
