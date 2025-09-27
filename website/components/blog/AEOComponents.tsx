import { Calendar, Zap, Clock, DollarSign, Shield, AlertCircle } from 'lucide-react'

// Direct Answer Box for AEO
export function DirectAnswerBox({ answer }: { answer: string }) {
  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/50 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3">
        <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-bold mb-2 text-white">Direct Answer</h2>
          <p className="text-white">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// Last Updated indicator
export function LastUpdated({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
      <Calendar className="w-4 h-4" />
      <span>Last updated: {date}</span>
    </div>
  )
}

// Quick Facts Box
export function QuickFacts({ facts }: { facts: Array<{ icon: React.ReactNode; label: string; value: string }> }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 mb-8">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-400" />
        Quick Facts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex items-center gap-3">
            {fact.icon}
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

// Comparison Table
export function ComparisonTable({
  headers,
  rows
}: {
  headers: string[]
  rows: string[][]
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