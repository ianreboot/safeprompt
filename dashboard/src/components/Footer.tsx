export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold mb-4 text-white">SafePrompt</h4>
            <p className="text-gray-400 text-sm">
              Protecting AI applications from prompt injection.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/about"}
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/blog/prevent-ai-email-attacks"}
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/contact?subject=technical-support&source=dashboard"}
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/terms"}
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href={(process.env.NEXT_PUBLIC_WEBSITE_URL || "https://safeprompt.dev") + "/privacy"}
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Reboot Media, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  )
}