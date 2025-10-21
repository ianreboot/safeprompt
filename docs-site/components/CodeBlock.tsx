'use client'

import { useState } from 'react'

interface CodeBlockProps {
  children: string
  language?: string
  showCopy?: boolean
}

export default function CodeBlock({
  children,
  language = 'text',
  showCopy = true
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group mb-6">
      <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-lg overflow-x-auto border border-zinc-800">
        <code className="text-sm font-mono leading-relaxed">{children}</code>
      </pre>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      )}
    </div>
  )
}
