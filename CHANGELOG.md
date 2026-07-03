# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository credibility uplift: GitHub Releases, reproducible benchmark harness,
  `@safeprompt.dev/langchain` source, conventional-commit enforcement, badges,
  uninstall/test sections in README, honest scope callout.

## [1.2.1] - 2026-07-03

### Fixed
- SDK response types and all docs/examples now match the live API response exactly:
  renamed `processingTimeMs` to `processingTime`, removed a documented field the API
  never returned, and updated example threat labels to the canonical public set.

## [1.2.0] - 2026-03-18

### Added
- `safeprompt-python` SDK (sync + async client) at parity with the JS SDK
- `mode` parameter (`fast` | `optimized`) on `check()` for both SDKs
- Multi-turn session tracking via `sessionId` parameter
- Full TypeScript declarations bundled in `dist/`

### Changed
- Default `baseURL` now uses `api.safeprompt.dev` (was a beta hostname)
- Error class consolidated to `SafePromptError` with `.code` / `.status` fields

## [1.1.0] - 2026-03-18

### Added
- `examples/` directory: Express, custom lists, IP reputation, multi-turn,
  session tokens, attack examples
- README expanded with side-by-side comparison vs Lakera Guard / OpenAI
  Moderation / DIY regex
- Publisher metadata (`repository`, `homepage`, `bugs`) in `package.json`

### Changed
- Lowered minimum Node from 20 → 18 for broader runtime support

## [1.0.0] - 2025-10-21

### Added
- Initial public release of SafePrompt SDK
- JavaScript/TypeScript SDK with full type support
- Layered validation system (pattern + AI analysis)
- Multi-turn attack detection with 95% accuracy
- External reference detection (URLs, IPs, file paths)
- Custom whitelist/blacklist support for paid tiers
- Session-based attack tracking
- Network threat intelligence sharing
- Comprehensive documentation and examples
- HTTP API reference
- Best practices security guide
- Migration guide for future versions
- Real-time dashboard for monitoring threats
- Privacy-first design with 24-hour PII deletion
- GDPR and CCPA compliance

### Security
- Above 95% single-turn attack detection accuracy
- 95% multi-turn attack detection accuracy
- Pattern detection responds in under 100ms; most requests complete in under 200ms
- Zero false positive rate in production testing

[Unreleased]: https://github.com/ianreboot/safeprompt/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/ianreboot/safeprompt/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ianreboot/safeprompt/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ianreboot/safeprompt/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ianreboot/safeprompt/releases/tag/v1.0.0
