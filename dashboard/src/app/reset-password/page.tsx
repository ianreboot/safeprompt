'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginHeader from '@/components/LoginHeader'
import Footer from '@/components/Footer'
import { Lock, Check, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  function validatePassword(password: string): string | null {
    if (password.length < 12) {
      return 'Password must be at least 12 characters'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  useEffect(() => {
    // Check if we have a valid session (from the magic link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
      setCheckingToken(false)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <LoginHeader />

      <div className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="max-w-md w-full">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Set new password
            </h1>
            <p className="text-gray-400 mt-2">
              Choose a strong password for your account
            </p>
          </div>

          {checkingToken ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Verifying reset link...</p>
            </div>
          ) : !validToken ? (
            <div className="bg-red-900/50 border border-red-800 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2">Invalid reset link</p>
              <p className="text-sm text-gray-400">
                This password reset link is invalid or has expired.
              </p>
              <a
                href="/forgot-password"
                className="inline-block mt-4 text-sm text-primary hover:underline"
              >
                Request a new reset link
              </a>
            </div>
          ) : success ? (
            <div className="bg-green-900/50 border border-green-800 rounded-lg p-6 text-center">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 mb-2">Password updated!</p>
              <p className="text-sm text-gray-400">
                Your password has been successfully updated.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  New password
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
                    minLength={12}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 12 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                    minLength={12}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-900/50 text-red-400 border border-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
