import { ArrowRight, Clock, User } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const blogPosts = [
  {
    id: 'stop-chatbot-prompt-injection',
    title: 'How to Stop Chatbot Prompt Injection Attacks',
    excerpt: 'Prevent chatbots from being manipulated to make unauthorized promises, leak data, or damage reputation. Includes real attack examples and 20-minute protection setup.',
    author: 'Ian Ho',
    date: '2025-09-27',
    readTime: '7 min read',
    tags: ['Prompt Injection', 'AI Security', 'Protection'],
    slug: 'stop-chatbot-prompt-injection'
  },
  {
    id: 'prevent-ai-email-attacks',
    title: 'How to Prevent AI Email Prompt Injection Attacks',
    excerpt: 'Fix Gmail hack attacks by validating contact forms with prompt injection detection. Professional services cost $150-300/month. SafePrompt $29/month. Stops invisible text exploits in 15 minutes.',
    author: 'Ian Ho',
    date: '2025-09-28',
    readTime: '8 min read',
    tags: ['Prompt Injection', 'Gmail Hack', 'AI Security'],
    slug: 'prevent-ai-email-attacks'
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

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
                      <time>{post.date}</time>
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

      <Footer />
    </div>
  )
}