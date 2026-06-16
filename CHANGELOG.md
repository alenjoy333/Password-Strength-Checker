# Changelog

## 2.0.0

Modern TypeScript rewrite of the original jQuery plugin.

### Added

- TypeScript monorepo: `@pwd-meter/core`, `/react`, `/vue`, `/angular`
- zxcvbn-based entropy scoring and cryptographically secure password generation
- HIBP k-anonymity breach checks via `checkPwnedPassword()` and `analyzePasswordAsync()`
- `checkPwned` and `hibpOptions` props on React, Vue, and Angular input/meter components
- `pwnedCheckPending`, `isPwned`, and `pwnedCount` fields on `PasswordStrengthResult`
- HIBP retry/backoff for HTTP 429 and 503 responses
- Framework hooks, composables, services, and UI components
- Unit tests for core HIBP and async analysis
- Legacy jQuery plugin preserved under `legacy/`

### Changed

- Replaced the original 10k embedded common-password list with optional online HIBP checks (~110 KB bundle reduction)
- `PasswordInput` components share a single HIBP request with their meter (no duplicate API calls)
- Vue composable options (`checkPwned`, `hibpOptions`) are reactive
- Angular `PasswordInput` includes screen-reader strength messaging

### Removed

- `data/10kPass.json` and `data/10kPass-min.json` (legacy plugin unchanged)
