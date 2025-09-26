'use client'

import { useState } from 'react'
import CodeBlock from './CodeBlock'

interface CodeExample {
  id: string
  label: string
  language: string
  code: string
  filename?: string
}

interface CodeTabsProps {
  examples: CodeExample[]
  className?: string
}

export default function CodeTabs({ examples, className = '' }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState(examples[0]?.id || '')
  const activeExample = examples.find(ex => ex.id === activeTab) || examples[0]

  if (!examples.length) return null

  return (
    <div className={`my-8 ${className}`}>
      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-800 mb-0">
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => setActiveTab(example.id)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap transition
              border-b-2 -mb-[2px]
              ${activeTab === example.id
                ? 'text-primary border-primary'
                : 'text-zinc-400 border-transparent hover:text-zinc-300'
              }
            `}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Active code block */}
      {activeExample && (
        <CodeBlock
          code={activeExample.code}
          language={activeExample.language}
          filename={activeExample.filename}
          className="rounded-t-none border-t-0"
        />
      )}
    </div>
  )
}