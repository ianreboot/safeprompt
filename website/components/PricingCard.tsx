'use client'

import { motion } from 'framer-motion'

interface PricingCardProps {
  title: string
  price: string
  period?: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant: 'primary' | 'secondary' | 'blue'
  popular?: boolean
}

export default function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant,
  popular
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`relative bg-card rounded-xl border ${
        popular ? 'border-primary shadow-xl shadow-primary/10' : 'border-border'
      } p-6`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
          RECOMMENDED
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="flex items-baseline space-x-1 mb-2">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-safe flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-3 rounded-lg font-semibold transition ${
          buttonVariant === 'primary'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : buttonVariant === 'blue'
            ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
            : 'border border-border text-foreground hover:bg-secondary'
        }`}
      >
        {buttonText}
      </button>
    </motion.div>
  )
}