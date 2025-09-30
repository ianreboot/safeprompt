'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Loader, XCircle } from 'lucide-react'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userPlan, setUserPlan] = useState<string>('free')

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

  async function handleEmailConfirmation() {
    try {
      // Get the token from URL hash (Supabase redirects with hash params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (!accessToken || type !== 'signup') {
        throw new Error('Invalid confirmation link')
      }

      // Set the session with the tokens from email link
      const { data: { user }, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      })

      if (sessionError || !user) {
        throw new Error('Failed to confirm email')
      }

      // Get user metadata to check plan
      const plan = user.user_metadata?.plan || 'free'
      setUserPlan(plan)

      // For free users, add to waitlist
      if (plan === 'free') {
        await addToWaitlist(user.email || '', user.id)
        setStatus('success')
        setMessage('waitlist')
      } else {
        // Paid users should already have access via Stripe
        setStatus('success')
        setMessage('dashboard')

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }

    } catch (error: any) {
      console.error('Confirmation error:', error)
      setStatus('error')
      setMessage(error.message || 'Something went wrong')
    }
  }

  async function addToWaitlist(email: string, userId: string) {
    try {
      const response = await fetch('https://api.safeprompt.dev/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'waitlist',
          data: {
            email,
            userId,
            source: 'email_confirmation',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add to waitlist')
      }
    } catch (error) {
      console.error('Waitlist error:', error)
      // Don't fail the whole process if waitlist fails
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Confirming your email...</h2>
          <p className="text-sm text-gray-400">Please wait</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Confirmation Failed</h2>
          <p className="text-gray-400 mb-6">{message}</p>

          <button
            onClick={() => window.location.href = 'https://safeprompt.dev/contact'}
            className="bg-gray-800 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    )
  }

  // Success states
  if (message === 'waitlist') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
          <p className="text-gray-400 mb-6">
            Your email has been confirmed and you've been added to the SafePrompt waitlist.
          </p>

          <div className="bg-gray-900 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span>We're reviewing waitlist applications (typically 2-3 weeks)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>You'll receive an approval email with dashboard access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Your API key will be ready to use immediately</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = 'https://safeprompt.dev'}
              className="w-full bg-gray-800 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Homepage
            </button>

            <button
              onClick={() => window.location.href = 'https://safeprompt.dev/signup?plan=paid'}
              className="w-full text-sm text-primary hover:underline"
            >
              Don't want to wait? Get instant access for $5/month →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Paid user success - redirecting to dashboard
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Email Confirmed!</h2>
        <p className="text-gray-400 mb-4">Redirecting to your dashboard...</p>
        <Loader className="w-6 h-6 text-primary animate-spin mx-auto" />
      </div>
    </div>
  )
}