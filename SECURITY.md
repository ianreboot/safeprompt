# Security Policy

This file states the same terms as [safeprompt.dev/security](https://safeprompt.dev/security) and the site's `/.well-known/security.txt`. If they ever differ, the security page is the current one.

## Reporting a Vulnerability

We take the security of SafePrompt seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Instead, email us at: **security@safeprompt.dev**

Include in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgement**: we aim to acknowledge your report within two business days
- **Initial assessment**: we aim to give you an initial assessment within ten business days. If we are going to miss that, we will tell you rather than go quiet
- **Regular updates**: we keep you informed of remediation progress
- **Credit**: we credit you in the fix announcement if you want it
- **Coordinated disclosure**: give us 90 days to fix an issue before publishing, or agree a different date with us

### Safe harbour

If you follow the rules below, we will not bring or support legal action against you for your research, and we will say so in writing if anyone asks. Stay within them:

- Test only against your own account and your own data, never another customer's
- Do not run denial-of-service, spam or social-engineering tests
- Do not access, copy, keep or publish anyone else's personal data, and stop and tell us the moment you encounter it
- Do not test our suppliers' systems, because we cannot speak for them
- Give us 90 days to fix an issue before publishing, or agree a different date with us

We cannot waive claims that belong to our customers, and we cannot bind law enforcement. What we can promise is our own conduct, and this is it.

### Supported Versions

Security fixes go to the latest published version of each package: `safeprompt` on npm and PyPI, `@safeprompt.dev/langchain` on npm, and `safeprompt-langchain` on PyPI. Older versions are not patched; update.

### Security Best Practices

When using SafePrompt:

- **Never commit API keys** to your repository
- **Use environment variables** for sensitive configuration
- **Keep the SDK updated** to the latest version
- **Monitor your usage** via the dashboard for suspicious activity
- **Send the end user's IP** in `X-User-IP`, never your server's, so threat intelligence attributes attacks correctly
- **Review our [Best Practices](./docs/BEST_PRACTICES.md)** guide

## Contact

- **Security issues**: security@safeprompt.dev
- **Privacy requests**: privacy@safeprompt.dev
- **General support**: support@safeprompt.dev
- **Website**: https://safeprompt.dev

Thank you for helping keep SafePrompt and our users safe!
