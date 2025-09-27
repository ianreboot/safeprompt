'use client'

import { Shield, LogOut } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo */}
          <a href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">SafePrompt</span>
          </a>

          {/* Right side - Usage, User info, Sign out */}
          <div className="flex items-center gap-6">
            {/* Usage indicator */}
            {usage && (
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{usage.current.toLocaleString()}</span>
                <span> / {usage.limit.toLocaleString()}</span>
              </div>
            )}

            {/* User email */}
            <div className="text-sm text-gray-400">
              {user?.email}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}