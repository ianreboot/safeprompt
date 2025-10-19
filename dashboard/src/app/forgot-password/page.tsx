'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginHeader from '@/components/LoginHeader'
import Footer from '@/components/Footer'
import { Mail, ArrowLeft, Check } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('rate limit') || error.message.includes('Email rate limit exceeded')) {
          throw new Error(
            'Too many password reset requests. Please wait a few minutes and try again. ' +
            'If you need immediate assistance, contact support@safeprompt.dev'
          )
        }

        // Handle invalid email
        if (error.message.includes('Invalid') || error.message.includes('not found')) {
          throw new Error(
            'We couldn\'t find an account with that email address. Please check the email and try again.'
          )
        }

        // Generic error
        throw error
      }

      setSent(true)
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <LoginHeader />

      <div className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="max-w-md w-full">
          {/* Back to login */}
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </a>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Reset your password
            </h1>
            <p className="text-gray-400 mt-2">
              {sent
                ? "Check your email for the reset link"
                : "Enter your email address and we'll send you a reset link"
              }
            </p>
          </div>

          {sent ? (
            <div className="bg-green-900/50 border border-green-800 rounded-lg p-6 text-center">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 mb-2">Email sent!</p>
              <p className="text-sm text-gray-400">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Check your inbox and click the link to reset your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
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
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
