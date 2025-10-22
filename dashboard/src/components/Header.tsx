'use client'

import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LogoText from './LogoText'
import Link from 'next/link'

interface HeaderProps {
  user: any
  usage?: {
    current: number
    limit: number
  }
}

export default function Header({ user, usage }: HeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <LogoText size="md" />
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </Link>

          {/* Right side - Navigation, Usage, User info, Sign out */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Docs link */}
            <a
              href="https://docs.safeprompt.dev"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
            {/* Usage indicator */}
            {usage && (
              <div className="hidden sm:block text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{usage.current.toLocaleString()}</span>
                <span> / {usage.limit.toLocaleString()}</span>
              </div>
            )}

            {/* User email */}
            <div className="hidden md:block text-sm text-muted-foreground">
              {user?.email}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}