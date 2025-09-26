'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

export default function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = false,
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')

  return (
    <div className={`relative group rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden ${className}`}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">{filename}</span>
          <span className="text-xs text-zinc-500">{language}</span>
        </div>
      )}

      <div className="relative">
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition opacity-0 group-hover:opacity-100 z-10"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        <div className="overflow-x-auto">
          <pre className="p-4 text-sm">
            <code className={`language-${language}`}>
              {showLineNumbers ? (
                <div className="flex">
                  <div className="flex flex-col text-zinc-600 select-none pr-4">
                    {lines.map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <div className="flex-1">{code}</div>
                </div>
              ) : (
                code
              )}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}