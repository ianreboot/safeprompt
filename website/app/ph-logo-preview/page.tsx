'use client'

export default function PHLogoPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Product Hunt Logo Animation Options</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Static */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-4">Static (No Animation)</h2>
            <div className="flex items-center justify-center h-64 bg-background rounded-lg">
              <img
                src="/ph-logo-240.png"
                alt="Static Logo"
                className="w-60 h-60"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Simple, clean, professional. No distraction.
            </p>
          </div>

          {/* Option 1: Pulsing */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-4">Option 1: Pulsing Shield</h2>
            <div className="flex items-center justify-center h-64 bg-background rounded-lg">
              <img
                src="/ph-logo-240.png"
                alt="Pulsing Logo"
                className="w-60 h-60 animate-pulse"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Subtle pulse every 2 seconds. Draws attention without being annoying.
            </p>
          </div>

          {/* Option 2: Glow */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-4">Option 2: Protection Glow</h2>
            <div className="flex items-center justify-center h-64 bg-background rounded-lg">
              <div className="relative">
                <img
                  src="/ph-logo-240.png"
                  alt="Glowing Logo"
                  className="w-60 h-60"
                  style={{
                    animation: 'glow 3s ease-in-out infinite'
                  }}
                />
                <style jsx>{`
                  @keyframes glow {
                    0%, 100% { filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0)); }
                    50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)); }
                  }
                `}</style>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Blue protective glow appears every 3 seconds. Shows "security shield" concept.
            </p>
          </div>

          {/* Option 3: Scale Pop */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-4">Option 3: Shield Pop</h2>
            <div className="flex items-center justify-center h-64 bg-background rounded-lg">
              <img
                src="/ph-logo-240.png"
                alt="Popping Logo"
                className="w-60 h-60"
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
            <p className="text-sm text-muted-foreground mt-4">
              Shield "pops" slightly every 3 seconds. Energetic, shows strength.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-primary/10 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold mb-3">💡 Recommendation</h3>
          <p className="text-sm text-muted-foreground mb-3">
            For Product Hunt, subtle animations perform better than aggressive ones:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Static</strong> - Safe, professional, works everywhere</li>
            <li>• <strong>Option 2 (Glow)</strong> - Best balance of attention + professionalism</li>
            <li>• <strong>Option 1 (Pulse)</strong> - Very subtle, might be too understated</li>
            <li>• <strong>Option 3 (Pop)</strong> - More noticeable, slightly less professional</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>My pick:</strong> Option 2 (Protection Glow) - clearly shows "security" without being distracting.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Product Hunt accepts both static PNG and animated GIF.<br />
            To create animated GIF: Choose an option above, then let me know and I'll generate it.
          </p>
        </div>
      </div>
    </div>
  )
}
