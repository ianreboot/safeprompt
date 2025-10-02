'use client'

export default function PHLogoExport() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {/* Exact 240x240px container for GIF export */}
      <div className="relative" style={{ width: '240px', height: '240px' }}>
        <img
          src="/ph-logo-240.png"
          alt="SafePrompt Logo"
          className="w-full h-full"
          style={{
            animation: 'pop 3s ease-in-out infinite'
          }}
        />
        <style jsx>{`
          @keyframes pop {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  )
}
