interface LogoTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function LogoText({ size = 'md', className = '' }: LogoTextProps) {
  // Configuration from your testing
  const config = {
    verticalOffset: 0,
    horizontalGap: 0,
    iconScale: 0.90
  }

  // Size mappings
  const sizes = {
    sm: {
      fontSize: 'text-xl',
      iconSize: 24,
      fontSizeClass: 'text-xl'
    },
    md: {
      fontSize: 'text-2xl',
      iconSize: 32,
      fontSizeClass: 'text-2xl'
    },
    lg: {
      fontSize: 'text-3xl',
      iconSize: 40,
      fontSizeClass: 'text-3xl'
    },
    xl: {
      fontSize: 'text-4xl',
      iconSize: 48,
      fontSizeClass: 'text-4xl'
    }
  }

  const currentSize = sizes[size]
  const actualIconSize = currentSize.iconSize * config.iconScale

  return (
    <div className={`inline-flex items-baseline ${className}`} style={{ gap: `${config.horizontalGap}px` }}>
      <img
        src="/safeprompt-icon.webp"
        alt="SafePrompt Shield"
        style={{
          height: `${actualIconSize}px`,
          width: `${actualIconSize}px`,
          transform: `translateY(${config.verticalOffset}px)`,
          display: 'inline-block'
        }}
      />
      <span className={`font-bold ${currentSize.fontSizeClass}`}>
        <span style={{ color: '#3b82f6' }}>afe</span>
        <span className="text-white">Prompt</span>
      </span>
    </div>
  )
}