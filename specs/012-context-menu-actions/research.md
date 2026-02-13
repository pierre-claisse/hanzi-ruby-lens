# Research: Context Menu Actions

**Feature**: 012-context-menu-actions
**Date**: 2026-02-13

## Decision 1: Opening URLs in Default Browser

**Decision**: Use `@tauri-apps/plugin-opener` with `openUrl()`.

**Rationale**: Standard web API `window.open()` opens links within the Tauri webview, not in the default browser. The opener plugin is the official Tauri 2 solution for launching external URLs in the system browser.

**Alternatives considered**:
- `window.open()` — opens in webview, not system browser. Rejected.
- `@tauri-apps/plugin-shell` with `open()` — also works but `opener` is the newer, dedicated plugin for this purpose.

**Integration**:
- npm: `@tauri-apps/plugin-opener`
- Rust: `tauri-plugin-opener = "2"` in Cargo.toml
- Register: `.plugin(tauri_plugin_opener::init())` in lib.rs
- Permission: `opener:allow-open-url` with https scope in tauri.conf.json capabilities
- API: `import { openUrl } from '@tauri-apps/plugin-opener'; await openUrl(url);`

## Decision 2: Clipboard Write

**Decision**: Use `@tauri-apps/plugin-clipboard-manager` with `writeText()`.

**Rationale**: Standard web API `navigator.clipboard.writeText()` triggers security prompts in the Tauri webview. The clipboard-manager plugin provides seamless, prompt-free clipboard access.

**Alternatives considered**:
- `navigator.clipboard.writeText()` — triggers security prompt dialogs. Rejected.
- `document.execCommand('copy')` — deprecated, unreliable. Rejected.

**Integration**:
- npm: `@tauri-apps/plugin-clipboard-manager`
- Rust: `tauri-plugin-clipboard-manager = "2"` in Cargo.toml
- Register: `.plugin(tauri_plugin_clipboard_manager::init())` in lib.rs
- Permission: `clipboard-manager:allow-write-text` in tauri.conf.json capabilities
- API: `import { writeText } from '@tauri-apps/plugin-clipboard-manager'; await writeText(text);`

## Decision 3: URL Encoding Strategy

**Decision**: Use JavaScript's built-in `encodeURIComponent()` for the word characters in the dictionary URL.

**Rationale**: Chinese characters must be URL-encoded in the query parameter. `encodeURIComponent()` correctly encodes UTF-8 characters (e.g., "勇往直前" → "%E5%8B%87%E5%BE%80%E7%9B%B4%E5%89%8D"). No additional library needed.

**Alternatives considered**:
- Manual encoding — error-prone, unnecessary. Rejected.
- `URLSearchParams` — would work but adds complexity for a single parameter insertion. Rejected.

## Decision 4: Testing Strategy for Plugin-Dependent Code

**Decision**: Mock Tauri plugin APIs in tests. Test URL construction and clipboard text independently from the actual plugin calls.

**Rationale**: Tauri plugins require the native runtime and cannot execute in a happy-dom/vitest environment. The menu action logic (building the URL, extracting characters) can be tested as pure functions. Plugin calls (`openUrl`, `writeText`) are mocked at the module level.

**Alternatives considered**:
- Skip testing plugin calls — insufficient coverage. Rejected.
- E2E testing with full Tauri — too heavy for this feature scope. Deferred.

## Decision 5: Google Translate URL Pattern

**Decision**: Use `https://translate.google.com/?sl={variant}&tl=en&text={encoded}` where variant is `zh-TW` (Traditional) or `zh-CN` (Simplified).

**Rationale**: Google Translate supports source language specification via the `sl` query parameter. Using explicit `zh-TW` or `zh-CN` ensures accurate translation context. The `tl=en` parameter sets English as the target language. URL format is stable and requires no authentication.

**Alternatives considered**:
- `sl=auto` (auto-detect) — works but less predictable. Using fixed zh-TW is simpler and consistent.
- `#zh-TW/en/text` hash format — older format, less reliable. Rejected.
- Third-party translation APIs — requires API keys and server-side calls. Rejected (overkill for URL-based lookup).
- Chinese variant detection (Simplified vs Traditional) — adds complexity (curated character set, utility function, extra tests) for marginal benefit. Rejected in favor of always using zh-TW.

## Decision 6: Menu Entry Icons

**Decision**: Use lucide-react icons: `BookSearch` for MOE Dictionary, `Languages` for Google Translate, `Copy` for Copy. Icons rendered inline to the left of the label text.

**Rationale**: lucide-react is already a project dependency (v0.563.0). All three icon names exist in the installed version. Icons provide visual affordance for each action without adding text length.

**Alternatives considered**:
- No icons (text-only labels) — less visually distinct. Rejected per user requirement.
- Custom SVG icons — unnecessary when lucide-react already has suitable options. Rejected.
