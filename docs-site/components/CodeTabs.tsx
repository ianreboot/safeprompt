'use client'

import { useState } from 'react'
import CodeBlock from './CodeBlock'

export interface CodeExample {
  label: string
  language: string
  code: string
}

interface CodeTabsProps {
  examples: CodeExample[]
}

export default function CodeTabs({ examples }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="mb-6">
      {/* Tab buttons */}
      <div className="flex gap-2 mb-0 border-b border-zinc-800 overflow-x-auto">
        {examples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === idx
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Active code block */}
      <div className="mt-0">
        <CodeBlock language={examples[activeTab].language}>
          {examples[activeTab].code}
        </CodeBlock>
      </div>
    </div>
  )
}
