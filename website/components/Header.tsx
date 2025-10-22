'use client'

import Link from 'next/link'
import { useState } from 'react'
import LogoText from './LogoText'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <LogoText size="md" />
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="https://docs.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">
              Docs
            </a>
            <Link href="/playground" className="text-muted-foreground hover:text-foreground transition">
              Playground
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition">
              Blog
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition">
              About
            </Link>
            <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL!} className="text-muted-foreground hover:text-foreground transition">
              Sign In
            </Link>
            <Link href="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Sign Up
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
            <a
              href="https://docs.safeprompt.dev"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>
            <Link
              href="/playground"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Playground
            </Link>
            <Link
              href="/blog"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL!}
              className="block text-muted-foreground hover:text-foreground transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}