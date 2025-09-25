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

  // Full shield path - matching the safe1.png design with inner cutout
  // Left side is from the image, right side mirrors it
  const fullShieldPath = "M 12 3 L 12 6 L 8 6 L 8 10 L 4 10 L 4 14 C 4 18 6 20 12 22 C 18 20 20 18 20 14 L 20 10 L 16 10 L 16 6 L 12 6 L 12 3"

  // Half shield for S integration (left side only)
  const halfShieldPath = "M 12 3 L 12 6 L 8 6 L 8 10 L 4 10 L 4 14 C 4 18 6 20 12 22 L 12 3"

  // Inner shield cutout shape
  const innerShieldPath = "M 12 7 L 12 9 L 10 9 L 10 11 L 8 11 L 8 14 C 8 16 9 17 12 18 C 15 17 16 16 16 14 L 16 11 L 14 11 L 14 9 L 12 9 L 12 7"
  const innerHalfPath = "M 12 7 L 12 9 L 10 9 L 10 11 L 8 11 L 8 14 C 8 16 9 17 12 18 L 12 7"

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
            d={fullShieldPath}
            fill="#3b82f6"
            className="shield-main"
          />
          <path
            d={innerShieldPath}
            fill="#000000"
            className="shield-cutout"
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
    // Shield above text (keeping for potential future use)
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
          <filter id="glowStacked">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shield centered above with more spacing */}
        <g className="shield-group" transform="translate(36, 0) scale(0.5)">
          <path
            d={fullShieldPath}
            fill="#3b82f6"
          />
          <path
            d={innerShieldPath}
            fill="#000000"
          />
        </g>

        {/* Text below with more spacing */}
        <text
          x="48"
          y="26"
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
            transform: translate(36, 0) scale(0.525);
            filter: url(#glowStacked) drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));
          }
        `}</style>
      </svg>
    )
  }

  // Default inline variant with corrected shield design
  const width = height * 5
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 32"
      className={`logo-inline ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glowInline">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Half shield integrated with S - scaled and positioned */}
      <g className="shield-group" transform="translate(4, 5) scale(1.0)">
        <path
          d={halfShieldPath}
          fill="#3b82f6"
        />
        <path
          d={innerHalfPath}
          fill="#000000"
        />
      </g>

      {/* SafePrompt text - adjusted positioning */}
      <text
        x="15"
        y="22"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="22"
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
          transform: translate(4, 5) scale(1.05);
          filter: url(#glowInline) drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));
        }
      `}</style>
    </svg>
  )
}