'use client'

interface LogoProps {
  variant?: 'inline' | 'stacked' | 'icon'
  height?: number
  className?: string
}

export default function Logo({
  variant = 'inline',
  height = 32,
  className = ''
}: LogoProps) {

  // Shield path - modern geometric design
  const shieldPath = "M 12 2 L 22 5 L 22 13 C 22 17 19 20 12 21 C 5 20 2 17 2 13 L 2 5 Z"
  const halfShieldPath = "M 12 2 L 12 21 C 5 20 2 17 2 13 L 2 5 Z"

  if (variant === 'icon') {
    // Just the shield for favicon
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 24 24"
        className={`logo-icon ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g className="shield-group">
          <path
            d={shieldPath}
            fill="url(#shieldGrad)"
            className="shield-main"
          />
          <path
            d="M 12 5 L 19 7 L 19 13 C 19 16 17 18 12 19"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.5"
            opacity="0.6"
          />
        </g>
        <style jsx>{`
          .shield-group {
            transition: transform 0.2s ease, filter 0.2s ease;
            transform-origin: center;
          }
          svg:hover .shield-group {
            transform: scale(1.05);
            filter: url(#glow) drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));
          }
        `}</style>
      </svg>
    )
  }

  if (variant === 'stacked') {
    // Shield above text
    const width = height * 3
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 96 32"
        className={`logo-stacked ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGradStacked" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="glowStacked">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shield centered above */}
        <g className="shield-group" transform="translate(36, 1) scale(0.5)">
          <path
            d={shieldPath}
            fill="url(#shieldGradStacked)"
          />
          <path
            d="M 12 5 L 19 7 L 19 13 C 19 16 17 18 12 19"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.5"
            opacity="0.6"
          />
        </g>

        {/* Text below */}
        <text
          x="48"
          y="24"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="11"
          textAnchor="middle"
        >
          <tspan fill="#3b82f6" fontWeight="700">Safe</tspan>
          <tspan fill="white" fontWeight="400">Prompt</tspan>
        </text>

        <style jsx>{`
          .shield-group {
            transition: transform 0.2s ease, filter 0.2s ease;
            transform-origin: 12px 12px;
          }
          svg:hover .shield-group {
            transform: translate(36, 1) scale(0.525);
            filter: url(#glowStacked) drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));
          }
        `}</style>
      </svg>
    )
  }

  // Default inline variant
  const width = height * 4.5
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 144 32"
      className={`logo-inline ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradInline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="glowInline">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Half shield integrated with S */}
      <g className="shield-group" transform="translate(2, 4)">
        <path
          d={halfShieldPath}
          fill="url(#shieldGradInline)"
        />
        <path
          d="M 12 5 L 19 7 L 19 11"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </g>

      {/* SafePrompt text */}
      <text
        x="14"
        y="22"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="20"
      >
        <tspan fill="#3b82f6" fontWeight="700">Safe</tspan>
        <tspan fill="white" fontWeight="400">Prompt</tspan>
      </text>

      <style jsx>{`
        .shield-group {
          transition: transform 0.2s ease, filter 0.2s ease;
          transform-origin: 12px 12px;
        }
        svg:hover .shield-group {
          transform: translate(2, 4) scale(1.05);
          filter: url(#glowInline) drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));
        }
      `}</style>
    </svg>
  )
}