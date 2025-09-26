# SafePrompt Blog Writing Guide

## Blog Standards & Components

### 1. File Structure
```
/app/blog/
├── page.tsx                    # Blog index page
├── [slug]/                     # Individual blog posts
│   └── page.tsx               # Blog post component
└── _template/                  # Templates and guides
    ├── blog-post-template.tsx # Template for new posts
    └── BLOG_WRITING_GUIDE.md  # This file
```

### 2. Available Components

#### BlogLayout
Main wrapper for all blog posts. Handles header, footer, and meta information.
```tsx
import BlogLayout from '@/components/blog/BlogLayout'

const meta = {
  title: 'Post Title',
  description: 'Post description',
  author: 'Author Name',
  date: '2025-01-26',
  readTime: '10 min read',
  tags: ['tag1', 'tag2']
}

<BlogLayout meta={meta}>
  {/* Your content */}
</BlogLayout>
```

#### CodeBlock
Single code block with syntax highlighting and copy functionality.
```tsx
import CodeBlock from '@/components/blog/CodeBlock'

<CodeBlock
  language="javascript"
  filename="example.js"  // Optional
  showLineNumbers={true}  // Optional
  code={`your code here`}
/>
```

#### CodeTabs
Multiple code examples with tab navigation.
```tsx
import CodeTabs from '@/components/blog/CodeTabs'

const examples = [
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    filename: 'example.js',
    code: `// code here`
  },
  // More examples...
]

<CodeTabs examples={examples} />
```

### 3. Styling Classes

#### Content Container
All blog content should be wrapped in:
```tsx
<div className="blog-content">
  {/* Your content */}
</div>
```

#### Headings
- `<h2>` - Major sections (auto-styled with border)
- `<h3>` - Subsections
- `<h4>` - Minor sections
- All headings are automatically styled via CSS

#### Callout Boxes
```tsx
<div className="callout callout-info">
  <h4>Title</h4>
  <p>Content</p>
</div>
```

Available types:
- `callout-info` - Blue, for tips and information
- `callout-warning` - Yellow, for warnings
- `callout-danger` - Red, for critical warnings
- `callout-success` - Green, for positive outcomes

#### Security Alert (Special)
```tsx
<div className="security-alert">
  <h3>
    <AlertTriangle className="w-5 h-5" />
    Critical Security Advisory
  </h3>
  <p>Alert content</p>
</div>
```

### 4. Writing Guidelines

#### Opening Hook
- Start with a compelling fact, question, or statement
- Use larger text for impact: `<p className="text-xl">`
- Keep it under 3 sentences

#### Structure
1. **Hook** - Grab attention immediately
2. **Problem** - Define the issue clearly
3. **Solution** - Present your approach
4. **Implementation** - Show practical examples
5. **Results** - Share metrics and outcomes
6. **Call to Action** - Clear next steps

#### Code Examples
- Always provide context before code
- Use realistic, production-ready examples
- Include error handling
- Show multiple frameworks when relevant
- Add comments for clarity

#### Visual Hierarchy
- Use headings to break up content
- Keep paragraphs short (3-4 sentences)
- Use lists for multiple points
- Include code examples every 2-3 sections
- Add callout boxes for important information

### 5. Technical Standards

#### Meta Information
```tsx
const blogMeta = {
  title: 'Clear, SEO-friendly title (50-60 chars)',
  description: 'Compelling description (150-160 chars)',
  author: 'SafePrompt Security Team',
  date: '2025-01-26', // YYYY-MM-DD format
  readTime: '10 min read', // Estimate 200 words/minute
  tags: ['Security', 'AI Safety'] // 2-5 relevant tags
}
```

#### Images (Future)
When adding images:
- Place in `/public/blog/[slug]/`
- Use descriptive alt text
- Optimize for web (WebP preferred)
- Include captions when helpful

#### Links
- Internal: Use Next.js Link component
- External: Add `target="_blank" rel="noopener"`
- Always provide context for links
- Check all links before publishing

### 6. Content Types

#### Security Advisory
- Lead with severity and CVE (if applicable)
- Include timeline
- Provide clear mitigation steps
- Show proof-of-concept responsibly

#### Tutorial
- Start with prerequisites
- Use numbered steps
- Include code at each step
- Provide complete working example
- Add troubleshooting section

#### Feature Announcement
- Lead with benefit, not feature
- Show before/after comparison
- Include migration guide if needed
- Provide code examples

#### Case Study
- Start with results
- Explain the problem
- Walk through solution
- Share metrics and lessons learned

### 7. SEO Checklist

- [ ] Title under 60 characters
- [ ] Description under 160 characters
- [ ] URL slug is descriptive and hyphenated
- [ ] Primary keyword in title
- [ ] Headers use semantic HTML (h2, h3, etc.)
- [ ] Alt text for all images
- [ ] Internal links to related content
- [ ] External links to authoritative sources

### 8. Pre-Publication Checklist

- [ ] All code examples tested and working
- [ ] Links verified and working
- [ ] No placeholder content
- [ ] Spelling and grammar checked
- [ ] Technical accuracy verified
- [ ] Security implications considered
- [ ] Meta information complete
- [ ] Mobile responsive (test at 375px width)

### 9. Creating a New Blog Post

1. Copy the template:
```bash
cp app/blog/_template/blog-post-template.tsx app/blog/your-slug/page.tsx
```

2. Update meta information
3. Replace placeholder content
4. Add your code examples
5. Test locally: `npm run dev`
6. Verify all components render correctly
7. Check responsive design
8. Commit and deploy

### 10. Component Examples

#### Grid Layout for Metrics
```tsx
<div className="grid md:grid-cols-2 gap-6 my-8">
  <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
    <h4>Metric Group 1</h4>
    <ul className="space-y-2 text-sm">
      <li>• Metric: <strong>Value</strong></li>
    </ul>
  </div>
  <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
    <h4>Metric Group 2</h4>
    <ul className="space-y-2 text-sm">
      <li>• Metric: <strong>Value</strong></li>
    </ul>
  </div>
</div>
```

#### Interactive Checklist
```tsx
<div className="bg-zinc-900 rounded-xl p-6 my-8 border border-zinc-800">
  <h4 className="text-white mb-4">Checklist Title</h4>
  <div className="space-y-3">
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1" />
      <span>Task description</span>
    </label>
  </div>
</div>
```

#### CTA Section
```tsx
<div className="bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl p-8 my-12 border border-primary/30">
  <h3 className="text-2xl font-bold mb-4">CTA Title</h3>
  <p className="mb-6">CTA description</p>
  <div className="flex flex-wrap gap-4">
    <a href="#" className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition">
      Primary Button
    </a>
    <a href="#" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg font-semibold border border-zinc-800 hover:bg-zinc-800 transition">
      Secondary Button
    </a>
  </div>
</div>
```

### 11. Tone & Voice

- **Professional** but approachable
- **Direct** without being blunt
- **Technical** with explanations
- **Urgent** for security issues
- **Helpful** with actionable advice

### 12. Common Mistakes to Avoid

- ❌ Walls of text without breaks
- ❌ Code without context
- ❌ Unverified technical claims
- ❌ Placeholder content in production
- ❌ Broken or placeholder links
- ❌ Overly complex explanations
- ❌ Missing security considerations
- ❌ Untested code examples

### Need Help?

- Review existing blog posts for examples
- Check component documentation in `/components/blog/`
- Test thoroughly in development
- Get review from team before publishing