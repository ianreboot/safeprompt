export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-6 border-t border-gray-800">
      <div className="container mx-auto">
        <div className="flex justify-between items-center text-sm">
          {/* Left side - Copyright */}
          <div className="text-gray-400">
            © {new Date().getFullYear()} Reboot Media, Inc.
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://safeprompt.dev/terms"
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms
            </a>
            <a
              href="https://safeprompt.dev/privacy"
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <a
              href="https://safeprompt.dev/contact?subject=technical-support&source=dashboard"
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}