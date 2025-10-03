import LogoText from './LogoText'

export default function LoginHeader() {
  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-gray-800">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <LogoText size="md" />

          {/* Right side - Sign up link for login page */}
          <a
            href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/signup"}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </header>
  )
}