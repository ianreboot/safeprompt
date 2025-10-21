'use client'

export default function EnvironmentBanner() {
  // Detect environment from hostname
  const isDev = typeof window !== 'undefined' &&
    (window.location.hostname.includes('dev-dashboard') ||
     window.location.hostname.includes('localhost') ||
     window.location.hostname.includes('127.0.0.1'))

  if (!isDev) return null

  return (
    <div className="bg-yellow-600 text-black text-center py-2 px-4 text-sm font-semibold fixed top-0 left-0 right-0 z-50">
      🚧 DEVELOPMENT ENVIRONMENT - Changes will not affect production
    </div>
  )
}
