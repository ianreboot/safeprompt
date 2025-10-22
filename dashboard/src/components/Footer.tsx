'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  // AI: Prevent hydration mismatch - year must match on server and initial client render
  const [year, setYear] = useState(2025);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-12 px-6 border-t border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold mb-4 text-white">SafePrompt</h4>
            <p className="text-gray-400 text-sm mb-3">
              Protecting AI applications from prompt injection.
            </p>
            <p className="text-gray-400 text-xs italic">
              Built the security tool I wish existed.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.safeprompt.dev"
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://docs.safeprompt.dev/api.html"
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="https://docs.safeprompt.dev/quick-start.html"
                  className="text-gray-400 hover:text-white transition text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quick Start
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
            </ul>
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
          © {year} Reboot Media, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  )
}