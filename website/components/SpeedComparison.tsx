'use client'

import { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const comparisons = [
  {
    label: 'DIY Regex Only',
    speed: 5,
    accuracy: '16%',
    accuracyValue: 16,
    description: '84% of attacks missed',
    color: 'bg-danger',
    good: false
  },
  {
    label: 'SafePrompt Regex',
    speed: 5,
    accuracy: '100%',
    accuracyValue: 100,
    description: 'Perfect for obvious attacks',
    color: 'bg-safe',
    good: true
  },
  {
    label: 'SafePrompt + AI',
    speed: 1048,
    accuracy: '100%',
    accuracyValue: 100,
    description: 'Context-aware protection',
    color: 'bg-primary',
    good: true
  }
]

export default function SpeedComparison() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [animatedValues, setAnimatedValues] = useState(comparisons.map(c => ({ speed: 0, accuracy: 0 })))

  useEffect(() => {
    if (!isInView) return

    const duration = 1500
    const steps = 60
    const interval = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedValues(comparisons.map(comp => ({
        speed: Math.round(comp.speed * progress),
        accuracy: Math.round(comp.accuracyValue * progress)
      })))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isInView])

  const maxSpeed = Math.max(...comparisons.map(c => c.speed))

  return (
    <div ref={ref} className="space-y-8">
      {comparisons.map((comp, index) => (
        <motion.div
          key={comp.label}
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{comp.label}</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {animatedValues[index].speed}ms ⚡
              </span>
              <span className={`text-sm font-semibold ${comp.good ? 'text-safe' : 'text-danger'}`}>
                {animatedValues[index].accuracy}% accuracy
              </span>
            </div>
          </div>

          {/* Speed bar */}
          <div className="mb-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${comp.color}`}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${(comp.speed / maxSpeed) * 100}%` } : {}}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {comp.good ? '✅' : '❌'} {comp.description}
          </p>

          {/* Best option indicator */}
          {index === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-4 inline-flex items-center space-x-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
            >
              <span>⭐</span>
              <span>Best for most requests</span>
            </motion.div>
          )}
        </motion.div>
      ))}

      <div className="bg-card/50 rounded-xl border border-border p-6 text-center">
        <p className="text-muted-foreground">
          <span className="text-foreground font-semibold">Smart routing:</span> 95% of requests use fast regex (5ms),
          only uncertain cases use AI validation
        </p>
      </div>
    </div>
  )
}