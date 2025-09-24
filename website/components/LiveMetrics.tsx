'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Threat {
  type: string
  time: string
}

export default function LiveMetrics() {
  const [attacksBlocked, setAttacksBlocked] = useState(17439)
  const [accuracy] = useState(100)
  const [avgSpeed] = useState(5)
  const [recentThreats, setRecentThreats] = useState<Threat[]>([
    { type: 'prompt_injection', time: '2 min ago' },
    { type: 'xss_attempt', time: '5 min ago' },
    { type: 'sql_injection', time: '12 min ago' },
    { type: 'system_override', time: '18 min ago' }
  ])

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setAttacksBlocked(prev => prev + Math.floor(Math.random() * 5))

      // Occasionally add new threat
      if (Math.random() > 0.7) {
        const threats = ['prompt_injection', 'xss_attempt', 'sql_injection', 'system_override', 'data_exfiltration']
        const newThreat = {
          type: threats[Math.floor(Math.random() * threats.length)],
          time: 'just now'
        }

        setRecentThreats(prev => {
          const updated = [newThreat, ...prev.slice(0, 3)]
          return updated.map((t, i) => ({
            ...t,
            time: i === 0 ? 'just now' : `${(i + 1) * 5} min ago`
          }))
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Attacks Blocked */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">🛡️</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        <div className="text-3xl font-bold mb-1">{attacksBlocked.toLocaleString()}</div>
        <div className="text-muted-foreground">Attacks Blocked This Week</div>
      </motion.div>

      {/* Accuracy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">🎯</span>
          <span className="text-xs text-muted-foreground">All-time</span>
        </div>
        <div className="text-3xl font-bold mb-1">{accuracy}%</div>
        <div className="text-muted-foreground">Detection Accuracy</div>
        <div className="mt-2 text-sm text-safe">0 false positives</div>
      </motion.div>

      {/* Average Speed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">⚡</span>
          <span className="text-xs text-muted-foreground">P50</span>
        </div>
        <div className="text-3xl font-bold mb-1">{avgSpeed}ms</div>
        <div className="text-muted-foreground">Average Response</div>
        <div className="mt-2 text-sm text-primary">95% use fast path</div>
      </motion.div>

      {/* Recent Threats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="md:col-span-3 bg-card rounded-xl border border-border p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <span>📊</span>
          <span>Latest Threats Blocked</span>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentThreats.map((threat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3"
            >
              <span className="text-sm font-mono text-danger">{threat.type}</span>
              <span className="text-xs text-muted-foreground">{threat.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}