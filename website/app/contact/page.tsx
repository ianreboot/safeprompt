'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('https://api.safeprompt.dev/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold gradient-text">SafePrompt</a>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</a>
            <a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Dashboard</a>
            <a href="/contact" className="text-foreground">Contact</a>
          </nav>
        </div>
      </header>

      {/* Contact Form */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-center mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-center text-muted-foreground mb-12">
              Have a question? Need help getting started? We're here to help.
            </p>

            <div className="bg-card rounded-xl border border-border p-8">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-safe mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
                  <p className="text-muted-foreground mb-6">
                    We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="enterprise">Enterprise Sales</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {status === 'error' && (
                    <div className="bg-danger/10 border border-danger rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                        <p className="text-danger text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
                      status === 'loading' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                    }`}
                  >
                    {status === 'loading' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>We typically respond within 24 hours during business days.</p>
              <p className="mt-2">
                For urgent issues, please include "URGENT" in your subject line.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold gradient-text">SafePrompt</h3>
              <p className="text-muted-foreground mt-2">Protecting AI applications from prompt injection.</p>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition">Terms</a>
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition">Privacy</a>
              <a href="/contact" className="text-foreground">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SafePrompt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}