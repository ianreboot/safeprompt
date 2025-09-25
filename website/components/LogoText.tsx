interface LogoTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function LogoText({ size = 'md', className = '' }: LogoTextProps) {
  // Configuration from your testing - adjusted vertical offset to lower icon
  const config = {
    verticalOffset: 3,  // Positive value moves icon down
    horizontalGap: -4,  // Negative value brings icon closer to text
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
        <span style={{ color: '#60a5fa' }}>afe</span>
        <span style={{ marginLeft: '0.15em' }} className="text-white">Prompt</span>
      </span>
    </div>
  )
}