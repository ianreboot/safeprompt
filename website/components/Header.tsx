import Link from 'next/link'
import LogoText from './LogoText'

export default function Header() {
  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <LogoText size="md" />
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition">
            Pricing
          </Link>
          <Link href="/#docs" className="text-muted-foreground hover:text-foreground transition">
            Documentation
          </Link>
          <Link href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">
            Dashboard
          </Link>
          <Link href="/#get-started" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}