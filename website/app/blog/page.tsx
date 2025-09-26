import { Shield, ArrowRight, Clock, User } from 'lucide-react'
import Link from 'next/link'

const blogPosts = [
  {
    id: 'chatbot-hacks',
    title: 'Your Chatbot Just Sold a Car for $1: The Corporate AI Disasters You Need to Prevent',
    excerpt: 'From Chevy dealerships to Air Canada lawsuits, chatbots are getting hacked daily. Real incidents, real lawsuits, and how to stop yours from becoming the next viral disaster.',
    author: 'SafePrompt Team',
    date: '2025-01-27',
    readTime: '7 min read',
    tags: ['Chatbots', 'AI Security', 'Real Incidents'],
    slug: 'chatbot-hacks'
  },
  {
    id: 'gmail-ai-threat',
    title: 'Ship Fast, Get Hacked: The AI Email Attack You\'re Missing',
    excerpt: 'Your contact form just made Gmail lie to you. Real attacks confirmed by Mozilla, Microsoft, and CISA. Here\'s a 15-minute fix that actually works.',
    author: 'SafePrompt Team',
    date: '2025-01-26',
    readTime: '5 min read',
    tags: ['Security', 'AI Safety', 'Gmail'],
    slug: 'gmail-ai-threat'
  }
]

export default function BlogPage() {
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
              <Link href="/" className="text-muted-foreground hover:text-foreground transition">
                Home
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Insights on AI security, prompt injection defense, and protecting your AI applications
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-zinc-900 rounded-lg p-8 hover:bg-zinc-800 transition">
                <Link href={`/blog/${post.slug}`}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <span>•</span>
                      <time>{new Date(post.date).toLocaleDateString()}</time>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold hover:text-primary transition">
                      {post.title}
                    </h2>

                    <p className="text-muted-foreground">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-zinc-800 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        Read more
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}