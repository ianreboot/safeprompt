'use client'

import BlogLayout from '@/components/blog/BlogLayout'
import CodeBlock from '@/components/blog/CodeBlock'
import CodeTabs from '@/components/blog/CodeTabs'
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react'

// TODO: Update these metadata fields for your blog post
const blogMeta = {
  title: 'Your Blog Post Title Here',
  description: 'A compelling description that summarizes your post in 1-2 sentences. This appears in social shares and search results.',
  author: 'SafePrompt Security Team',
  date: '2025-01-26', // Format: YYYY-MM-DD
  readTime: '8 min read',
  tags: ['Security', 'AI Safety'] // Add relevant tags
}

export default function BlogPostTemplate() {
  // Example: Multiple code examples for tabs
  const codeExamples = [
    {
      id: 'javascript',
      label: 'JavaScript',
      language: 'javascript',
      filename: 'example.js',
      code: `// Your JavaScript code here
const example = 'Hello, World!'
console.log(example)`
    },
    {
      id: 'python',
      label: 'Python',
      language: 'python',
      filename: 'example.py',
      code: `# Your Python code here
example = 'Hello, World!'
print(example)`
    }
  ]

  return (
    <BlogLayout meta={blogMeta}>
      <div className="blog-content">
        {/* Opening hook - grab attention immediately */}
        <p className="text-xl">
          Start with a compelling opening that hooks the reader. This should be a bold statement,
          surprising fact, or provocative question that makes them want to keep reading.
        </p>

        {/* Alert boxes for critical information */}
        <div className="security-alert">
          <h3>
            <AlertTriangle className="w-5 h-5" />
            Critical Security Advisory
          </h3>
          <p className="text-red-300 mb-0">
            Use this for urgent security information or warnings that readers need to know immediately.
          </p>
        </div>

        {/* Main content sections */}
        <h2>First Major Section</h2>

        <p>
          Your main content goes here. Keep paragraphs focused and scannable. Use <strong>bold text</strong> for
          emphasis and <em>italics</em> for subtle emphasis or technical terms.
        </p>

        <p>
          Break up long sections with lists, code examples, and visual elements to maintain reader engagement.
        </p>

        {/* Lists for better readability */}
        <h3>Key Points to Remember</h3>

        <ul>
          <li>Use bullet points for unordered lists</li>
          <li>Keep each point concise and actionable</li>
          <li>Group related concepts together</li>
          <li>Use <strong>bold</strong> to highlight key terms</li>
        </ul>

        <h3>Step-by-Step Process</h3>

        <ol>
          <li><strong>First Step:</strong> Clear action to take</li>
          <li><strong>Second Step:</strong> Follow-up action with context</li>
          <li><strong>Third Step:</strong> Verification or testing step</li>
          <li><strong>Final Step:</strong> Deployment or completion</li>
        </ol>

        {/* Code examples */}
        <h2>Implementation Examples</h2>

        <p>
          When showing code, provide context first, then show the implementation:
        </p>

        {/* Single code block */}
        <CodeBlock
          language="javascript"
          filename="config.js"
          code={`// Configuration example
const config = {
  apiKey: process.env.SAFEPROMPT_API_KEY,
  mode: 'optimized',
  timeout: 5000
}

// Use the configuration
const result = await validatePrompt(userInput, config)`}
        />

        {/* Multiple language examples with tabs */}
        <h3>Multi-Language Implementation</h3>

        <p>
          Show the same concept in multiple languages using tabs:
        </p>

        <CodeTabs examples={codeExamples} />

        {/* Callout boxes for different types of information */}
        <h2>Different Types of Callouts</h2>

        <div className="callout callout-info">
          <h4 className="text-blue-300 font-bold mb-2">
            <Info className="inline w-5 h-5 mr-2" />
            Information
          </h4>
          <p className="mb-0">
            Use info callouts for helpful tips, additional context, or non-critical information
            that enhances understanding.
          </p>
        </div>

        <div className="callout callout-warning">
          <h4 className="text-yellow-300 font-bold mb-2">
            <AlertTriangle className="inline w-5 h-5 mr-2" />
            Warning
          </h4>
          <p className="mb-0">
            Use warning callouts for important caveats, potential pitfalls, or things to be
            careful about.
          </p>
        </div>

        <div className="callout callout-danger">
          <h4 className="text-red-300 font-bold mb-2">
            <Shield className="inline w-5 h-5 mr-2" />
            Security Risk
          </h4>
          <p className="mb-0">
            Use danger callouts for security vulnerabilities, critical errors, or anything that
            could cause data loss or system compromise.
          </p>
        </div>

        <div className="callout callout-success">
          <h4 className="text-green-300 font-bold mb-2">
            <CheckCircle className="inline w-5 h-5 mr-2" />
            Success
          </h4>
          <p className="mb-0">
            Use success callouts for completed actions, positive outcomes, or confirmation that
            something worked correctly.
          </p>
        </div>

        {/* Tables for structured data */}
        <h2>Comparison Table Example</h2>

        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Option A</th>
              <th>Option B</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Performance</td>
              <td>Fast (50ms)</td>
              <td>Slower (200ms)</td>
              <td>Option A</td>
            </tr>
            <tr>
              <td>Security</td>
              <td>Good</td>
              <td>Excellent</td>
              <td>Option B</td>
            </tr>
            <tr>
              <td>Cost</td>
              <td>$10/month</td>
              <td>$5/month</td>
              <td>Option B</td>
            </tr>
          </tbody>
        </table>

        {/* Interactive elements */}
        <h2>Interactive Checklist</h2>

        <div className="bg-zinc-900 rounded-xl p-6 my-8 border border-zinc-800">
          <h4 className="text-white mb-4">Implementation Checklist</h4>
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>First task to complete with helpful context</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>Second task with a <a href="#">link to documentation</a></span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>Third task that builds on previous steps</span>
            </label>
          </div>
        </div>

        {/* Blockquotes for emphasis */}
        <blockquote>
          "Use blockquotes for important quotes, key takeaways, or to highlight critical
          information that you want readers to remember."
        </blockquote>

        {/* Conclusion */}
        <hr />

        <h2>Conclusion</h2>

        <p className="text-xl">
          End with a strong conclusion that summarizes key points and provides clear next steps.
        </p>

        <p>
          Reinforce the main message and give readers actionable takeaways they can implement
          immediately.
        </p>

        {/* Call to action */}
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl p-8 my-12 border border-primary/30">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="mb-6">
            A compelling call to action that encourages readers to take the next step, whether
            that's signing up, trying the API, or learning more.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://safeprompt.dev"
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              <Shield className="w-5 h-5" />
              Primary Action
            </a>
            <a
              href="https://dashboard.safeprompt.dev/docs"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg font-semibold border border-zinc-800 hover:bg-zinc-800 transition"
            >
              Secondary Action
            </a>
          </div>
        </div>

        {/* References and further reading */}
        <hr />

        <h3>References & Further Reading</h3>

        <ul>
          <li>
            <a href="#" target="_blank" rel="noopener">
              External Reference with Description
            </a> - Brief description of what this link contains
          </li>
          <li>
            <a href="#" target="_blank" rel="noopener">
              Academic Paper or Research
            </a> - Why this is relevant to the topic
          </li>
          <li>
            <a href="#" target="_blank" rel="noopener">
              Related Documentation
            </a> - Additional technical details
          </li>
        </ul>
      </div>
    </BlogLayout>
  )
}