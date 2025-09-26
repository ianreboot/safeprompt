import { ReactNode } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Clock, User, Calendar } from 'lucide-react'

interface BlogLayoutProps {
  children: ReactNode
  meta: {
    title: string
    description: string
    author: string
    date: string
    readTime: string
    tags?: string[]
  }
}

export default function BlogLayout({ children, meta }: BlogLayoutProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-black/80 border-b border-zinc-800 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">SafePrompt</span>
            </Link>
            <div className="flex items-center space-x-8">
              <Link href="/blog" className="text-muted-foreground hover:text-foreground transition">
                Blog
              </Link>
              <Link href="/#docs" className="text-muted-foreground hover:text-foreground transition">
                Documentation
              </Link>
              <Link href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 mb-8 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Article header */}
          <header className="mb-12">
            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{meta.author}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time>{new Date(meta.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</time>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{meta.readTime}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {meta.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-zinc-400 leading-relaxed">
              {meta.description}
            </p>

            {/* Tags */}
            {meta.tags && meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {meta.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Article content with prose styling */}
          <div className="blog-content">
            {children}
          </div>
        </div>
      </article>

      {/* Footer CTA */}
      <section className="border-t border-zinc-800">
        <div className="container mx-auto max-w-4xl px-6 py-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Protect Your AI Applications</h2>
            <p className="text-zinc-400 mb-8 max-w-2xl">
              Don't wait for your AI to be compromised. SafePrompt provides enterprise-grade protection
              against prompt injection attacks with just one line of code.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://dashboard.safeprompt.dev/signup"
                className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Start Free Trial
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                href="/#docs"
                className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg font-semibold border border-zinc-800 hover:bg-zinc-800 transition"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}