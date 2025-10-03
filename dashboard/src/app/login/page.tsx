'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginHeader from '@/components/LoginHeader'
import Footer from '@/components/Footer'
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Sign in existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect to dashboard
      window.location.href = '/'
    } catch (error: any) {
      setMessage(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <LoginHeader />

      <div className="flex-1 flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full">
        {/* Login heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Sign in to your dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Welcome back
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Check your email')
                ? 'bg-green-900/50 text-green-400 border border-green-800'
                : 'bg-red-900/50 text-red-400 border border-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="flex items-center justify-end mb-4">
            <a
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to main signup page */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?
            {' '}
            <a
              href="https://safeprompt.dev/signup"
              className="text-primary hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>


      </div>
      </div>

      <Footer />
    </div>
  )
}