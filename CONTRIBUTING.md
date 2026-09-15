# Contributing to SafePrompt

Thank you for your interest in contributing to SafePrompt! We welcome contributions from the community.

## Ways to Contribute

### 1. Report Bugs

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- SDK version and environment details
- Relevant code snippets (with API keys removed)

### 2. Suggest Features

Have an idea for improvement? Open an issue with:
- Use case description
- Proposed solution
- Why this would benefit other users
- Any alternatives you've considered

### 3. Improve Documentation

Documentation improvements are always welcome:
- Fix typos or clarify confusing sections
- Add more code examples
- Improve error messages
- Expand guides and tutorials

Two rules for anything in this repo that a reader or an AI assistant might quote:

- **No hand-typed accuracy, false-positive or latency figures.** The numbers on safeprompt.dev render from the continuous production eval at every deploy. A README states where the current figure is, or quotes a committed run record with its date, mode and case set. A figure without those three is removed in review.
- **Every raw HTTP sample sends both headers**, `X-API-Key` and `X-User-IP`. The API answers HTTP 400 without the second one, and a sample that fails on paste is the most expensive kind of documentation.

### 4. Submit Code

Want to contribute code? Here's how:

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/ianreboot/safeprompt.git
cd safeprompt

# Install dependencies
cd packages/safeprompt-js
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

#### Making Changes

1. **Fork the repository** and create a new branch
2. **Make your changes** following our code style
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with clear description

#### Code Style

- Use TypeScript for all SDK code
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write descriptive commit messages

#### Commit Message Format

```
type: short description

Longer explanation if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 5. Share Attack Examples

Help improve SafePrompt's detection by sharing:
- New attack patterns you've encountered
- Real-world prompt injection examples (anonymized)
- Edge cases that weren't caught

**Important**: Only share attack examples that:
- Are publicly known techniques
- Don't expose real user data
- Don't reveal security vulnerabilities in specific systems

Scope note: SafePrompt detects attacks on the reading AI (instruction override, jailbreaks, system-prompt extraction, exfiltration imperatives, indirect injection). A SQL, XSS or shell payload carried as data, or a harmful-topic question, is out of scope by design and will be labelled `safe` in the benchmark suite; see `benchmarks/README.md`.

## Pull Request Process

1. **Create an issue first** (for non-trivial changes) to discuss the approach
2. **Fork the repo** and create a feature branch
3. **Make your changes** with clear, focused commits
4. **Update documentation** to reflect your changes
5. **Submit PR** with:
   - Clear description of changes
   - Link to related issue
   - Before/after examples if applicable
   - Confirmation that tests pass

## Code Review

All submissions require review. We'll:
- Review within 1-3 business days
- Provide constructive feedback
- Collaborate with you on improvements
- Merge when ready

## Testing

Before submitting:
- [ ] SDK builds without errors (`npm run build`)
- [ ] TypeScript compilation passes
- [ ] Code follows existing style
- [ ] Documentation updated
- [ ] No sensitive data exposed

## Questions?

- Open an issue for technical questions
- Email support@safeprompt.dev for private inquiries
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be:
- Listed in release notes
- Credited in documentation
- Thanked in the community

Thank you for helping make SafePrompt better! 🛡️
