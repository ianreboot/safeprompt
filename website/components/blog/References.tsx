import React from 'react'

export interface Reference {
  title: string
  url: string
  source?: string
  date?: string
}

interface ReferenceSectionProps {
  references: Reference[]
  title?: string
}

export default function ReferenceSection({
  references,
  title = "References & Further Reading"
}: ReferenceSectionProps) {
  return (
    <>
      <hr />

      <h3>{title}</h3>

      <div className="bg-zinc-900 rounded-lg p-6 my-4 border border-zinc-800">
        <ul className="space-y-2">
          {references.map((ref, index) => (
            <li key={index} className="flex flex-col gap-1">
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {ref.title}
              </a>
              {(ref.source || ref.date) && (
                <span className="text-sm text-zinc-500">
                  {ref.source && ref.source}
                  {ref.source && ref.date && ' • '}
                  {ref.date && ref.date}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function ProofOfConceptBox({
  title,
  url,
  description
}: {
  title: string
  url: string
  description: string
}) {
  return (
    <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 my-4">
      <p className="text-orange-300 font-semibold mb-2">{title}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 transition-colors"
      >
        {description}
      </a>
    </div>
  )
}