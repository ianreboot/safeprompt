'use client'

import React from 'react'

interface SafePromptLogoProps {
  variant?: 'inline' | 'stacked' | 'icon'
  height?: number
  className?: string
  showText?: boolean
}

export default function SafePromptLogo({
  variant = 'inline',
  height = 32,
  className = '',
  showText = true
}: SafePromptLogoProps) {
  // Calculate dimensions based on variant and height
  const getViewBox = () => {
    switch(variant) {
      case 'icon':
        return '0 0 40 40'
      case 'stacked':
        return '0 0 120 60'
      case 'inline':
      default:
        return '0 0 200 40'
    }
  }

  const getWidth = () => {
    switch(variant) {
      case 'icon':
        return height
      case 'stacked':
        return height * 2 // 120/60 ratio
      case 'inline':
      default:
        return height * 5 // 200/40 ratio
    }
  }

  return (
    <svg
      width={getWidth()}
      height={height}
      viewBox={getViewBox()}
      className={`safeprompt-logo ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for shield depth */}
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow filter for hover */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Full shield shape - geometric but recognizable */}
        <path
          id="fullShield"
          d="M 20 4 L 36 8 L 36 22 C 36 28 32 34 20 36 C 8 34 4 28 4 22 L 4 8 Z"
          fill="url(#shieldGradient)"
        />

        {/* Half shield for 'S' integration */}
        <path
          id="halfShield"
          d="M 20 4 L 20 36 C 8 34 4 28 4 22 L 4 8 Z"
          fill="url(#shieldGradient)"
        />

        {/* Shield inner accent line */}
        <path
          id="shieldAccent"
          d="M 20 8 L 32 11 L 32 22 C 32 26 29 30 20 32"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1"
          opacity="0.5"
        />
      </defs>

      <style>
        {`
          .safeprompt-logo .shield-element {
            transition: transform 0.2s ease, filter 0.2s ease;
            transform-origin: center;
          }
          .safeprompt-logo:hover .shield-element {
            transform: scale(1.05);
            filter: url(#glow) drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
          }
          .shield-icon {
            transform-origin: 20px 20px;
          }
        `}
      </style>

      {/* Icon variant - just the shield */}
      {variant === 'icon' && (
        <g className="shield-element shield-icon">
          <use href="#fullShield" />
          <use href="#shieldAccent" />
        </g>
      )}

      {/* Stacked variant - shield above text */}
      {variant === 'stacked' && (
        <g>
          <g className="shield-element" transform="translate(40, 0) scale(0.5)">
            <use href="#fullShield" />
            <use href="#shieldAccent" />
          </g>
          {showText && (
            <g transform="translate(60, 45)">
              <text
                x="0"
                y="0"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="18"
                textAnchor="middle"
              >
                <tspan fill="#3b82f6" fontWeight="700">Safe</tspan>
                <tspan fill="white" fontWeight="400">Prompt</tspan>
              </text>
            </g>
          )}
        </g>
      )}

      {/* Inline variant - half shield integrated with S */}
      {variant === 'inline' && (
        <g>
          {/* Half shield integrated with 'S' */}
          <g className="shield-element" transform="translate(0, 4) scale(0.8)">
            <use href="#halfShield" />
            <path
              d="M 20 8 L 32 11 L 32 16"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1"
              opacity="0.5"
            />
          </g>

          {showText && (
            <g>
              {/* Safe text with integrated S */}
              <text
                x="28"
                y="26"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="24"
                fontWeight="700"
                fill="#3b82f6"
              >
                afe
              </text>

              {/* S that integrates with shield */}
              <text
                x="16"
                y="26"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="24"
                fontWeight="700"
                fill="#3b82f6"
              >
                S
              </text>

              {/* Prompt text */}
              <text
                x="85"
                y="26"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="24"
                fontWeight="400"
                fill="white"
              >
                Prompt
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  )
}