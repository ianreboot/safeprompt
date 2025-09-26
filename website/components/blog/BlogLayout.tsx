import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Article */}
      <article className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Article header */}
          <header className="mb-12">
            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{meta.author}</span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time>{new Date(meta.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</time>
              </div>
              <span className="text-muted-foreground/50">•</span>
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
            <p className="text-xl text-muted-foreground leading-relaxed">
              {meta.description}
            </p>

            {/* Tags */}
            {meta.tags && meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {meta.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground">
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
      <section className="border-t border-border">
        <div className="container mx-auto max-w-4xl px-6 py-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Protect Your AI Applications</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Don't wait for your AI to be compromised. SafePrompt provides enterprise-grade protection
              against prompt injection attacks with just one line of code.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://dashboard.safeprompt.dev/signup"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Start Free Trial
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                href="/#docs"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold border border-border hover:bg-secondary/80 transition"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}