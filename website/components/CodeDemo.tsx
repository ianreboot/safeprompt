'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CodeDemo() {
  const [activeTab, setActiveTab] = useState<'vulnerable' | 'protected'>('vulnerable')

  const vulnerableCode = `// ❌ VULNERABLE - No protection
const response = await openai.complete(userInput);
// Your AI is exposed to prompt injection!`

  const protectedCode = `// ✅ PROTECTED - With SafePrompt
const check = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sp_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
}).then(r => r.json());

if (check.safe) {
  const response = await openai.complete(userInput);
  // Your AI is now protected!
} else {
  console.warn('Blocked threats:', check.threats);
  // Handle malicious input appropriately
}`

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('vulnerable')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition ${
            activeTab === 'vulnerable'
              ? 'bg-danger/10 text-danger border-b-2 border-danger'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Before SafePrompt
        </button>
        <button
          onClick={() => setActiveTab('protected')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition ${
            activeTab === 'protected'
              ? 'bg-safe/10 text-safe border-b-2 border-safe'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          After SafePrompt
        </button>
      </div>

      {/* Code Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'vulnerable' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <pre className="code-block overflow-x-auto">
            <code className="text-sm">
              {activeTab === 'vulnerable' ? vulnerableCode : protectedCode}
            </code>
          </pre>
        </motion.div>

        {/* Integration Time */}
        <div className="mt-6 flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">1 minute integration</span>
          </div>
        </div>
      </div>
    </div>
  )
}