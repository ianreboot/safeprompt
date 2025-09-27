import { ReactNode } from 'react'
import { Shield, Clock, DollarSign, Zap, Calendar, AlertCircle } from 'lucide-react'
import Script from 'next/script'

export interface QuickFact {
  label: string
  value: string
  icon?: ReactNode
}

export interface AEOMetadata {
  directAnswer: string
  lastUpdated: string
  quickFacts: QuickFact[]
  schemaMarkup?: any
}

interface AEOLayoutProps {
  title: string
  metadata: AEOMetadata
  children: ReactNode
}

export default function AEOLayout({ title, metadata, children }: AEOLayoutProps) {
  const { directAnswer, lastUpdated, quickFacts, schemaMarkup } = metadata

  // Default schema if none provided
  const schema = schemaMarkup || {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "datePublished": lastUpdated,
    "dateModified": lastUpdated,
    "author": {
      "@type": "Organization",
      "name": "SafePrompt"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SafePrompt",
      "logo": {
        "@type": "ImageObject",
        "url": "https://safeprompt.dev/logo.png"
      }
    },
    "description": directAnswer
  }

  return (
    <>
      <Script
        id="schema-markup"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* AEO Header - Direct Answer First */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            {title}
          </h1>

          {/* Direct Answer Box - Most Important for AI Extraction */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <p className="text-lg text-white font-medium">
                {directAnswer}
              </p>
            </div>
          </div>

          {/* Last Updated - Critical for AI Trust */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>

          {/* Quick Facts Box */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Quick Facts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickFacts.map((fact, index) => (
                <div key={index} className="flex items-center gap-3">
                  {fact.icon || <span className="text-zinc-500">•</span>}
                  <div>
                    <span className="text-zinc-400 text-sm">{fact.label}:</span>
                    <span className="text-white font-medium ml-2">{fact.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="blog-content prose prose-invert max-w-none">
          {children}
        </div>
      </article>
    </>
  )
}

// Quick Facts Helper Component
export function QuickFactsBox({ facts }: { facts: QuickFact[] }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex items-center gap-3">
            {fact.icon || <span className="text-zinc-500">•</span>}
            <div>
              <span className="text-zinc-400 text-sm">{fact.label}:</span>
              <span className="text-white font-medium ml-2">{fact.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Comparison Table Component for AEO
export function ComparisonTable({
  headers,
  rows
}: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}) {
  return (
    <div className="overflow-x-auto my-8">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="bg-zinc-900 text-white text-left p-3 border border-zinc-800 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="p-3 border border-zinc-800 text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}