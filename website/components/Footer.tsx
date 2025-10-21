import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold mb-4">SafePrompt</h4>
            <p className="text-muted-foreground text-sm mb-3">
              Protecting AI applications from prompt injection.
            </p>
            <p className="text-muted-foreground text-xs italic">
              Vibe coded solo after seeing AI apps get exploited. Built the security tool I wish existed.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://docs.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://docs.safeprompt.dev/api.html" className="text-muted-foreground hover:text-foreground transition text-sm">
                  API Reference
                </a>
              </li>
              <li>
                <a href="https://docs.safeprompt.dev/quick-start.html" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Quick Start
                </a>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://github.com/ianreboot/safeprompt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition text-sm">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/playground" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Playground
                </Link>
              </li>
              <li>
                <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL!} className="text-muted-foreground hover:text-foreground transition text-sm">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Reboot Media, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  )
}